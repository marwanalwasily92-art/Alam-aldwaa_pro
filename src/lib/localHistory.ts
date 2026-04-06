import { HistoryItem } from '../types';
import { db, storage } from './firebase';
import { collection, addDoc, deleteDoc, doc, Timestamp, query, where, getDocs, limit, writeBatch, setDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

const LOCAL_HISTORY_KEY = 'pharma_world_local_history';
const MAX_LOCAL_ITEMS = 10;

// Helper to sanitize sensitive data
const sanitizeSensitiveData = (text: string | undefined): string | undefined => {
  if (!text) return text;
  // Simple regex for email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  // Simple regex for phone number (basic)
  const phoneRegex = /\b\d{10,15}\b/g;
  
  return text
    .replace(emailRegex, '[REDACTED_EMAIL]')
    .replace(phoneRegex, '[REDACTED_PHONE]');
};

export const saveToLocalHistory = async (item: Omit<HistoryItem, 'id'>, user: any): Promise<HistoryItem> => {
  const newItem: HistoryItem = {
    ...item,
    id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
  };

  let history = getLocalHistory();

  // Enforce limit and handle space
  const trySave = (items: HistoryItem[]): boolean => {
    try {
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(items));
      return true;
    } catch (e) {
      return false;
    }
  };

  // 1. Try to add and save
  let updatedHistory = [newItem, ...history];
  
  // 2. If full, delete oldest until 10 or less
  while (updatedHistory.length > MAX_LOCAL_ITEMS) {
    updatedHistory.pop();
  }

  // 3. Try saving. If fails (QuotaExceeded), keep deleting until it fits
  while (!trySave(updatedHistory) && updatedHistory.length > 0) {
    updatedHistory.pop();
  }
  
  // If still fails (even with 0 items), it's truly broken.
  if (!trySave(updatedHistory)) {
    console.error("Critical: Cannot save to localStorage even after clearing.");
    return newItem; // Return item, but don't sync to Firebase as requested
  }

  // 4. Sync to Firebase ONLY if not anonymous AND local save succeeded
  if (user && !user.isAnonymous) {
    try {
      const historyRef = doc(db, "history", newItem.id);
      
      // Filter out undefined values to prevent Firestore errors
      const firestoreData: any = {
        id: newItem.id,
        user_id: user.uid,
        tool_type: newItem.tool_type,
        response: sanitizeSensitiveData(newItem.response) || '',
        created_at: Timestamp.fromDate(new Date(newItem.created_at))
      };

      if (newItem.input_text !== undefined) {
        firestoreData.input_text = sanitizeSensitiveData(newItem.input_text);
      }
      if (newItem.image_url !== undefined) {
        firestoreData.image_url = newItem.image_url;
      }
      if (newItem.image_path !== undefined) {
        firestoreData.image_path = newItem.image_path;
      }

      await setDoc(historyRef, firestoreData);
    } catch (e) {
      console.error("Failed to sync to Firebase, but saved locally.", e);
      // As requested: "if local storage doesn't allow, don't keep record in Firebase"
    }
  }

  return newItem;
};

export const getLocalHistory = (): HistoryItem[] => {
  const saved = localStorage.getItem(LOCAL_HISTORY_KEY);
  if (!saved) return [];
  try {
    const items = JSON.parse(saved) as HistoryItem[];
    
    // Define TTL period (1 hour)
    const hoursToKeep = 1;
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursToKeep);
    const cutoffTime = cutoffDate.getTime();

    // Deduplicate by ID and filter out expired items
    const seen = new Set<string>();
    const validItems = items.filter(item => {
      // Check if item is expired
      const itemTime = new Date(item.created_at).getTime();
      if (itemTime < cutoffTime) return false;

      // Ensure ID exists
      if (!item.id) {
        item.id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      }
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    // If items were removed (expired or duplicates), update local storage
    if (validItems.length !== items.length) {
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(validItems));
    }

    return validItems;
  } catch (e) {
    console.error('Failed to parse local history', e);
    return [];
  }
};

export const deleteFromLocalHistory = async (id: string, user: any) => {
  const history = getLocalHistory();
  const updatedHistory = history.filter(item => item.id !== id);
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updatedHistory));

  // Sync delete to Firebase if not anonymous
  if (user && !user.isAnonymous) {
    try {
      // Need to find the item to get image_path for storage deletion
      const itemToDelete = history.find(item => item.id === id);
      
      const adminEmails = ["marwanalwasily96@gmail.com", "kinging71317@gmail.com"];
      const isAdmin = adminEmails.includes(user.email || '');
      
      // Only attempt to delete from Firebase if the user owns this record or is admin
      if (itemToDelete && (itemToDelete.user_id === user.uid || isAdmin)) {
        if (itemToDelete.image_path) {
          try {
            const imageRef = ref(storage, itemToDelete.image_path);
            await deleteObject(imageRef);
          } catch (storageError) {
            console.warn('Could not delete image from storage (likely permissions), continuing with document deletion:', storageError);
          }
        }
        await deleteDoc(doc(db, 'history', id));
      }
    } catch (e) {
      console.error('Failed to delete from Firebase', e);
    }
  }
};

export const clearLocalHistory = () => {
  localStorage.removeItem(LOCAL_HISTORY_KEY);
};

/**
 * Cleanup old history records from Firestore (TTL Alternative)
 * Implements the "Hybrid Local-First" strategy:
 * - Records are kept permanently in LocalStorage.
 * - Records in Firebase are deleted after 1 hour (Global Cleanup).
 */
export const performGlobalCleanup = async (user: any) => {
  if (!user) return;

  try {
    // 1. Clean up Local Storage first (to ensure user sees immediate effect)
    getLocalHistory(); // This function now automatically filters and deletes expired local items

    const adminEmails = ["marwanalwasily96@gmail.com", "kinging71317@gmail.com"];
    const isAdmin = adminEmails.includes(user.email || '');

    // Define TTL period (1 hour for "Bridge" mode)
    const hoursToKeep = 1;
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursToKeep);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const historyRef = collection(db, "history");
    
    // If not admin, only cleanup OWN records
    let q;
    if (isAdmin) {
      q = query(
        historyRef,
        where("created_at", "<", cutoffTimestamp),
        limit(50)
      );
    } else {
      // NOTE: For regular users, this query requires a composite index in Firestore:
      // Collection: history | Fields: user_id (ASC), created_at (ASC)
      // If this index is missing, the query will fail silently.
      q = query(
        historyRef,
        where("user_id", "==", user.uid),
        where("created_at", "<", cutoffTimestamp),
        limit(50)
      );
    }

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const batch = writeBatch(db);
      for (const document of querySnapshot.docs) {
        const data = document.data();
        if (data.image_path) {
          try {
            const imageRef = ref(storage, data.image_path);
            await deleteObject(imageRef);
          } catch (e) { /* Ignore */ }
        }
        batch.delete(document.ref);
      }
      // 3. Cleanup analysis_cache (older than 24h)
      const cacheRef = collection(db, 'analysis_cache');
      const cacheCutoff = new Date();
      cacheCutoff.setHours(cacheCutoff.getHours() - 24);
      const cacheTimestamp = Timestamp.fromDate(cacheCutoff);
      const cacheQuery = query(cacheRef, where('created_at', '<', cacheTimestamp));
      const cacheSnap = await getDocs(cacheQuery);
      cacheSnap.docs.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
      console.log(`✅ [Pharma World] Cleanup Success: Removed ${querySnapshot.size} expired records from Firebase.`);
    } else {
      console.log(`✅ [Pharma World] Cleanup Checked: No expired records found in Firebase (older than ${hoursToKeep} hour).`);
    }

    // 2. User Accounts Cleanup (Only for Admins)
    if (isAdmin) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const userCutoff = Timestamp.fromDate(thirtyDaysAgo);

      const usersRef = collection(db, "users");
      const userQuery = query(
        usersRef,
        where("created_at", "<", userCutoff),
        limit(20)
      );

      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        const userBatch = writeBatch(db);
        userSnapshot.docs.forEach(doc => userBatch.delete(doc.ref));
        await userBatch.commit();
        console.log(`Admin Cleanup: Removed ${userSnapshot.size} inactive user accounts.`);
      }
    }
  } catch (e) {
    // Silently fail or log for debugging
    console.debug("Cleanup skipped or failed:", e);
  }
};

export const exportHistoryAsJSON = () => {
  const history = getLocalHistory();
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pharma_history_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
