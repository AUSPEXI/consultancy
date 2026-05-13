import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, signInWithGoogle, logout, db } from '../firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

import { UserTier } from '@/constants/tiers';
export type { UserTier };

export interface UserData {
  tier: UserTier;
  role: 'admin' | 'user';
  email?: string | null;
  onboardingCompleted?: boolean;
  brand?: string;
  domain?: string;
  competitors?: string[];
  keywords?: string[];
  cmsWebhookUrl?: string;
  sentimentPrompts?: string[];
  connectedSocials?: string[];
}

interface AuthContextType {
  user: User | null;
  tier: UserTier;
  role: 'admin' | 'user';
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tier, setTier] = useState<UserTier>('Free');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;
    
    // Safety timeout: stop loading after 5 seconds even if Firebase hasn't responded
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth initialization timed out. Forcing loading to false.");
        setLoading(false);
      }
    }, 5000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.uid || "no user");
      clearTimeout(safetyTimeout);
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Initial fetch and create if not exists
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const initialData: UserData = { 
              tier: 'Free', 
              role: 'user', 
              email: currentUser.email, 
              onboardingCompleted: false 
            };
            await setDoc(userDocRef, initialData);
            setTier('Free');
            setRole('user');
            setUserData(initialData);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }

        // Listen for real-time tier/role changes
        unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            setTier(data.tier || 'Free');
            setRole(data.role || 'user');
            setUserData({
              ...data,
              onboardingCompleted: data.onboardingCompleted ?? false
            });
          } else {
            setTier('Free');
            setRole('user');
            setUserData(null);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        });

      } else {
        setTier('Free');
        setRole('user');
        setUserData(null);
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, tier, role, userData, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
