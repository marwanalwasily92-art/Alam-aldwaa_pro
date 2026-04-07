import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, getDocFromServer, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, setLogLevel } from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress transient connection warnings from Firebase SDK
setLogLevel('silent');

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "" 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined;

// Use initializeFirestore with long polling to ensure connectivity in restricted environments
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    // Use standard fetch streams if possible, but long polling is safer here
  }, dbId);
} catch (e) {
  console.error("Failed to initialize Firestore with settings, falling back to default:", e);
  firestoreDb = initializeFirestore(app, {}, dbId);
}
export const db = firestoreDb;

export const storage = getStorage(app);

export const MAX_DAILY_QUOTA = 5;

export function getDeviceId() {
  // Use a combination of localStorage and a persistent cookie-like approach if possible
  // For now, we'll stick to a robust localStorage key that is less likely to be cleared by accident
  let id = localStorage.getItem('pharma_world_stable_id');
  if (!id) {
    // Try to see if there's an old ID to migrate
    const oldId = localStorage.getItem('pharma_device_id');
    if (oldId) {
      id = oldId;
    } else {
      id = crypto.randomUUID();
    }
    localStorage.setItem('pharma_world_stable_id', id);
  }
  return id;
}

export const ADMIN_EMAILS = ["marwanalwasily96@gmail.com", "kinging71317@gmail.com", "salahwasel129@gmail.com"];

export async function getSystemApiKey(): Promise<string | null> {
  try {
    const configRef = doc(db, 'system_config', 'gemini_api');
    const configSnap = await getDoc(configRef);
    if (configSnap.exists()) {
      return configSnap.data().api_key || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching system API key:", error);
    return null;
  }
}

export async function setSystemApiKey(apiKey: string): Promise<void> {
  const userEmail = auth.currentUser?.email;
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    throw new Error("عذراً، هذه الصلاحية للمشرفين فقط.");
  }
  
  try {
    const configRef = doc(db, 'system_config', 'gemini_api');
    await setDoc(configRef, {
      api_key: apiKey,
      updated_at: serverTimestamp(),
      updated_by: userEmail
    });
  } catch (error) {
    console.error("Error setting system API key:", error);
    throw error;
  }
}

// Helper to create a simple hash for strings/images
export async function createHash(input: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getCache(toolType: string, prompt: string, imageData?: string): Promise<string | null> {
  try {
    const inputToHash = `${toolType}_${prompt}_${imageData || ''}`;
    const hash = await createHash(inputToHash);
    const cacheRef = doc(db, 'analysis_cache', hash);
    const cacheSnap = await getDoc(cacheRef);
    
    if (cacheSnap.exists()) {
      const data = cacheSnap.data();
      // Check if cache is still valid (within 24 hours)
      const now = Date.now();
      const cacheTime = data.created_at?.toMillis() || 0;
      if (now - cacheTime < 24 * 60 * 60 * 1000) {
        return data.response;
      }
    }
    return null;
  } catch (error) {
    console.error("Cache retrieval error:", error);
    return null;
  }
}

export async function setCache(toolType: string, prompt: string, response: string, imageData?: string) {
  try {
    const inputToHash = `${toolType}_${prompt}_${imageData || ''}`;
    const hash = await createHash(inputToHash);
    const cacheRef = doc(db, 'analysis_cache', hash);
    await setDoc(cacheRef, {
      tool_type: toolType,
      prompt_hash: await createHash(prompt),
      response: response,
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.error("Cache storage error:", error);
  }
}

export async function checkAndIncrementQuota(userId: string, hasCustomKey: boolean): Promise<{ allowed: boolean; remaining: number; maxQuota: number }> {
  if (!userId) return { allowed: false, remaining: 0, maxQuota: 5 };

  // Bypass quota for admins
  const userEmail = auth.currentUser?.email;
  if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
    return { allowed: true, remaining: 999, maxQuota: 999 };
  }
  
  const deviceId = getDeviceId();
  const deviceRef = doc(db, 'device_usage', deviceId);
  const statsRef = doc(db, 'system_stats', 'daily');
  
  // Use Mecca (Asia/Riyadh) time for daily reset
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  try {
    // 1. Get/Reset Global Stats
    const statsSnap = await getDoc(statsRef);
    let publicUserCount = 0;
    let privateUserCount = 0;
    
    if (!statsSnap.exists() || statsSnap.data().last_reset_date !== today) {
      await setDoc(statsRef, { 
        public_user_count: 0, 
        private_user_count: 0, 
        last_reset_date: today 
      }, { merge: true });
    } else {
      const data = statsSnap.data();
      publicUserCount = data.public_user_count || 0;
      privateUserCount = data.private_user_count || 0;
    }

    // Determine Max Quota based on user type and global stats
    let dynamicMaxQuota = 5;
    if (hasCustomKey) {
      // Private key users: 10 for first 400, then 5
      dynamicMaxQuota = privateUserCount < 400 ? 10 : 5;
    } else {
      // Public key users: always 5
      dynamicMaxQuota = 5;
    }

    // 2. Get Device Stats
    const deviceSnap = await getDoc(deviceRef);
    
    if (!deviceSnap.exists() || deviceSnap.data().last_reset_date !== today) {
      // Check global limits before allowing a new user
      if (!hasCustomKey && publicUserCount >= 300) {
        return { allowed: false, remaining: 0, maxQuota: 0 }; // Public limit reached
      }
      if (hasCustomKey && privateUserCount >= 650) {
        return { allowed: false, remaining: 0, maxQuota: 0 }; // Private limit reached
      }

      // First request of the day for this device
      await setDoc(deviceRef, {
        usage_count: 1,
        last_reset_date: today,
        last_user_id: userId,
        is_private: hasCustomKey
      }, { merge: true });
      
      // Update global counters
      if (hasCustomKey) {
        await updateDoc(statsRef, { private_user_count: increment(1) });
      } else {
        await updateDoc(statsRef, { public_user_count: increment(1) });
      }
      
      return { allowed: true, remaining: dynamicMaxQuota - 1, maxQuota: dynamicMaxQuota };
    }
    
    const deviceData = deviceSnap.data();
    const currentUsage = deviceData.usage_count || 0;
    const isToday = deviceData.last_reset_date === today;
    
    let allowed = false;
    let remaining = 0;
    let effectiveMaxQuota = dynamicMaxQuota;

    // Handle transition from private to anonymous
    let anonymousLimit = deviceData.anonymous_limit || 0;
    let hasLimitSet = deviceData.anonymous_limit_set && isToday;

    if (hasCustomKey) {
      // Logic for users with their own key
      allowed = currentUsage < dynamicMaxQuota;
      effectiveMaxQuota = dynamicMaxQuota;
      remaining = Math.max(0, dynamicMaxQuota - (currentUsage + 1));
    } else {
      // Anonymous mode strategy
      if (deviceData.is_private && isToday && !hasLimitSet) {
        // First time switching to anonymous after being private today
        const usageAtSwitch = currentUsage;
        const extraAllowed = Math.min(5, 10 - usageAtSwitch);
        anonymousLimit = usageAtSwitch + extraAllowed;
        hasLimitSet = true;
        
        // Update the document with the new limit
        await updateDoc(deviceRef, {
          anonymous_limit: anonymousLimit,
          anonymous_limit_set: true
        });
      }

      const limit = hasLimitSet ? anonymousLimit : 5;
      allowed = currentUsage < limit;
      remaining = Math.max(0, limit - (currentUsage + 1));
      effectiveMaxQuota = 5; // We show 5 as the "standard" max in UI
    }

    if (!allowed) {
      return { allowed: false, remaining: 0, maxQuota: effectiveMaxQuota };
    }
    
    // Increment usage
    await updateDoc(deviceRef, {
      usage_count: increment(1),
      last_user_id: userId,
      is_private: hasCustomKey || deviceData.is_private // Keep true if it was ever true today
    });
    
    return { allowed: true, remaining, maxQuota: effectiveMaxQuota };
  } catch (error) {
    console.error("Quota check error:", error);
    handleFirestoreError(error, OperationType.WRITE, `quota_check_failed`);
    return { allowed: false, remaining: 0, maxQuota: 5 };
  }
}

export async function deleteImageFromStorage(imagePath: string) {
  if (!imagePath) return;
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    console.log('Image deleted successfully from storage');
  } catch (error) {
    console.error('Error deleting image from storage:', error);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
