import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * The service-account secret has historically been stored inconsistently
 * (raw JSON, base64, double-base64, stray whitespace/BOM) — see
 * scripts/ci-decode-sa.mjs which the rules-deploy workflow already uses.
 * Production was returning 503 "Server auth not configured" because this file
 * only accepted single-base64. Decode tolerantly with the same strategies.
 */
function decodeServiceAccount(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/^﻿/, '').replace(/[​‌‍﻿­]/g, '').trim();
  const looksLikeSA = (o: any) => o && typeof o === 'object' && o.client_email && o.private_key;
  const strategies: Array<() => unknown> = [
    () => JSON.parse(cleaned),
    () => JSON.parse(Buffer.from(cleaned, 'base64').toString('utf8')),
    () => JSON.parse(Buffer.from(Buffer.from(cleaned, 'base64').toString('utf8').trim(), 'base64').toString('utf8')),
  ];
  for (const fn of strategies) {
    try {
      const o = fn();
      if (looksLikeSA(o)) return o as Record<string, unknown>;
    } catch {
      // try next strategy
    }
  }
  return null;
}

const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || process.env.FIREBASE_SERVICE_ACCOUNT;

if (!admin.apps.length && saRaw) {
  const serviceAccount = decodeServiceAccount(saRaw);
  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
      console.log('Firebase Admin initialized from service account.');
    } catch (error: any) {
      console.error('Failed to initialize Firebase Admin:', error?.message);
    }
  } else {
    console.error(
      `Firebase Admin: FIREBASE_SERVICE_ACCOUNT_BASE64 is set (${saRaw.length} chars) but could not be ` +
      'parsed as raw JSON, base64, or double-base64 service-account JSON. ' +
      'Re-encode with `base64 -w0 service-account.json` and update the env var.'
    );
  }
} else if (!admin.apps.length) {
  console.error('Firebase Admin: FIREBASE_SERVICE_ACCOUNT_BASE64 env var is NOT set. Server-side auth/DB disabled.');
}
// No fallback to admin.initializeApp() — default creds probe GCP metadata server
// which hangs indefinitely on non-GCP hosts (Netlify/Vercel) causing build timeouts.

const DATABASE_ID = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'ai-studio-2cf48d01-0e3c-41eb-88cf-8117f9ee3d0c';

export const dbAdmin = admin.apps.length
  ? getFirestore(admin.app(), DATABASE_ID)
  : null;

export const adminAuth = admin.apps.length ? admin.auth() : null;

export default admin;
