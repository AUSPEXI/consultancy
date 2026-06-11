import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii')
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
    }
  } else {
    // Fallback to application default
    try {
      admin.initializeApp();
    } catch (err) {}
  }
}

export const dbAdmin = admin.apps.length ? admin.firestore() : null;
export const authAdmin = admin.apps.length ? admin.auth() : null;
