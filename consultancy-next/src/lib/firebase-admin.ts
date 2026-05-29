import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii')
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized from service account.');
  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}
// No fallback to admin.initializeApp() — default creds probe GCP metadata server
// which hangs indefinitely on non-GCP hosts (Netlify/Vercel) causing build timeouts.

const DATABASE_ID = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'ai-studio-2cf48d01-0e3c-41eb-88cf-8117f9ee3d0c';

export const dbAdmin = admin.apps.length
  ? getFirestore(admin.app(), DATABASE_ID)
  : null;

export default admin;

