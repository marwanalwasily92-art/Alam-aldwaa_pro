import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
        setError(null);
      } else {
        // If no user is signed in, sign in anonymously
        setLoading(true);
        setUser(null);
        
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Anonymous sign-in failed:", err);
          setLoading(false);
          setError("فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const syncUser = async () => {
        try {
          const userDoc = doc(db, 'users', user.uid);
          const snap = await getDoc(userDoc);
          
          const today = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Riyadh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(new Date());

          if (!snap.exists()) {
            await setDoc(userDoc, {
              displayName: 'مستخدم زائر',
              role: 'user',
              isAnonymous: true,
              usage_count: 0,
              last_reset_date: today,
              created_at: serverTimestamp()
            });
          } else {
            // Update existing user info if needed
            await setDoc(userDoc, {
              isAnonymous: true,
              last_active: serverTimestamp()
            }, { merge: true });
          }
        } catch (err) {
          console.error("Error syncing user:", err);
        }
      };
      syncUser();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
