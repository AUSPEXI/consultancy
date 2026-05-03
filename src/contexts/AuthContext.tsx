import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, signInWithGoogle, logout, db } from '../firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

export type UserTier = 'Free' | 'Basic' | 'Medium' | 'Premium' | 'PipelineOffer';

export interface UserData {
  tier: UserTier;
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
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tier, setTier] = useState<UserTier>('Free');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Initial fetch and create if not exists
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const initialData: UserData = { tier: 'Free', email: currentUser.email, onboardingCompleted: false };
            await setDoc(userDocRef, initialData);
            setTier('Free');
            setUserData(initialData);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }

        // Listen for real-time tier changes
        unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            setTier(data.tier || 'Free');
            setUserData({
              ...data,
              onboardingCompleted: data.onboardingCompleted ?? false
            });
          } else {
            setTier('Free');
            setUserData(null);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        });

      } else {
        setTier('Free');
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
    <AuthContext.Provider value={{ user, tier, userData, loading, signInWithGoogle, logout }}>
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
