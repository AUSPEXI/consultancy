import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii')
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully from base64 service account.');
    } catch (error: any) {
      console.error('Failed to initialize Firebase Admin from base64:', error);
    }
  } else {
    try {
      admin.initializeApp();
      console.log('Firebase Admin initialized with default credentials.');
    } catch (err: any) {
      console.warn('Firebase Admin default initialization failed or SDK not configured:', err.message);
    }
  }
}

const DATABASE_ID = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'ai-studio-2cf48d01-0e3c-41eb-88cf-8117f9ee3d0c';

export const dbAdmin = admin.apps.length
  ? getFirestore(admin.app(), DATABASE_ID)
  : null;

export default admin;

