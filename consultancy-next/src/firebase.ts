import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Guard against SSG/build-time runs where Firebase env vars aren't available.
// useEffect in AuthContext ensures auth/db are only accessed on the client.
let app: FirebaseApp | null = null
if (firebaseConfig.apiKey) {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
}

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'ai-studio-2cf48d01-0e3c-41eb-88cf-8117f9ee3d0c'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: Firestore = app ? getFirestore(app, databaseId) : (null as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: Auth = app ? getAuth(app) : (null as any)
export const googleProvider = new GoogleAuthProvider()
