import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app
const apps = getApps()

if (apps.length > 0) {
  app = apps[0]
} else {
  app = initializeApp(firebaseConfig)
}

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'ai-studio-2cf48d01-0e3c-41eb-88cf-8117f9ee3d0c'
export const db = getFirestore(app, databaseId)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
