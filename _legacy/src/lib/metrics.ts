import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export async function logSimulatorResult(userId: string, sovScore: number) {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const shortDate = today.toLocaleDateString('en-US', { weekday: 'short' });
    
    // We use a deterministic daily document ID to unify metrics
    const metricRef = doc(db, 'sovMetrics', `${userId}_${dateStr}`);

    const docSnap = await getDoc(metricRef);
    if (!docSnap.exists()) {
      // If no audit has been run today, initialize the daily block
      await setDoc(metricRef, {
        userId,
        date: dateStr,
        shortDate,
        aSov: sovScore,
        err: 20, // default baselines if no real audit exists
        compA: 40,
        compB: 30,
        compGap: sovScore - 40,
        aiTraffic: 120,
        lastUpdated: new Date().toISOString()
      });
    } else {
      // If it exists, gracefully merge the new exact Simulator score
      const data = docSnap.data();
      await setDoc(metricRef, {
        aSov: sovScore,
        compGap: sovScore - (data.compA || 40),
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    console.error("Failed to log weekly metrics:", error);
  }
}
