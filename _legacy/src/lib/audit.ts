import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const logAuditAction = async (userId: string | undefined, action: string, details: any = {}) => {
  if (!userId) return;
  
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      action,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // In a strict SOC 2 environment, failing to log might require halting the action.
    // For this implementation, we log to console to prevent breaking the UX.
  }
};
