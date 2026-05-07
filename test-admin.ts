import admin from 'firebase-admin';
import config from './firebase-applet-config.json' assert { type: 'json' };

const app = admin.initializeApp({
  projectId: config.projectId,
});
const db = app.firestore();
db.settings({ databaseId: config.firestoreDatabaseId });

async function run() {
  try {
    const snap = await db.collection("users").limit(1).get();
    console.log("Success! Users count:", snap.size);
  } catch (e) {
    console.error("FAIL:", e);
  }
}
run();
