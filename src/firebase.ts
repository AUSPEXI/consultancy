import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Gather config from environment variables
const firebaseConfig: any = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
};

// 2. Initialize App
let app;
const apps = getApps();

if (apps.length > 0) {
  app = apps[0];
} else {
  // If we're in AI Studio and env vars are missing, we'll try to find the config synchronously
  // (In a real Vite build, we'd use a plugin or env injection, but here we can try a few fallbacks)
  const finalConfig = { ...firebaseConfig };
  
  if (!finalConfig.apiKey) {
    // If you need to debug config loading, you can add logs here
    // but we'll default to dummy values to prevent absolute crashes
    finalConfig.apiKey = finalConfig.apiKey || "AI_STUDIO_DUMMY";
    finalConfig.projectId = finalConfig.projectId || "AI_STUDIO_DUMMY";
  }

  app = initializeApp(finalConfig);
}

// 3. Define services
export const db = getFirestore(app, process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID || "(default)");
export const auth = getAuth(app);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
