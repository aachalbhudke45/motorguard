// ============================================================================
// DATA SERVICE – the single persistence API used by the app.
// The dashboard only calls these functions. Today they write to localStorage;
// if Firebase credentials are present they ALSO mirror to Firestore.
// Connecting real Firebase later needs no dashboard changes.
// ============================================================================

import { localStore } from './localStore';
import { getFirestoreDb, isFirebaseConfigured } from './firebase';

async function cloud(fn) {
  const handle = await getFirestoreDb();
  if (!handle) return;
  try {
    await fn(handle.db, handle.fs);
  } catch (err) {
    console.warn('[MotorGuard] Firestore write failed:', err.message);
  }
}

export const dataService = {
  backend: isFirebaseConfigured ? 'Firebase Firestore + localStorage cache' : 'localStorage (offline mode)',
  isCloud: isFirebaseConfigured,

  // ----- local snapshot (whole app state, fast reload) -----
  loadState: () => localStore.get('state'),
  saveState: (state) => localStore.set('state', state),
  clearState: () => localStore.remove('state'),

  // ----- cloud mirrors (no-ops without Firebase) -----
  saveReading: (reading, evaluation) =>
    cloud((db, fs) =>
      fs.addDoc(fs.collection(db, 'sensorReadings'), {
        ...reading,
        healthScore: evaluation.health,
        motorStatus: evaluation.status,
        createdAt: fs.serverTimestamp(),
      }),
    ),

  saveMotorStatus: (evaluation, timestamp) =>
    cloud((db, fs) =>
      fs.setDoc(fs.doc(db, 'motorStatus', 'current'), {
        status: evaluation.status,
        healthScore: evaluation.health,
        risk: evaluation.risk,
        condition: evaluation.condition,
        timestamp,
        updatedAt: fs.serverTimestamp(),
      }),
    ),

  saveAlert: (alert) => cloud((db, fs) => fs.addDoc(fs.collection(db, 'alerts'), { ...alert, createdAt: fs.serverTimestamp() })),

  saveMaintenanceRecord: (record) =>
    cloud((db, fs) => fs.addDoc(fs.collection(db, 'maintenanceRecords'), { ...record, createdAt: fs.serverTimestamp() })),
};
