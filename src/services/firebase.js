// ============================================================================
// FIREBASE SERVICE (optional)
// Firebase is loaded lazily and ONLY when credentials exist in .env.
// Without credentials the app runs fully on localStorage.
//
// Firestore collections used:
//   sensorReadings     – one document per reading (timestamp, values, health, status)
//   alerts             – generated alerts (severity, message, sensor, value, timestamp)
//   motorStatus        – single doc "current" with live status, healthScore, risk
//   maintenanceRecords – checklist completions and maintenance log entries
// ============================================================================

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let dbPromise = null;

/** Returns a Firestore helper bundle, or null if Firebase is not configured / fails. */
export function getFirestoreDb() {
  if (!isFirebaseConfigured) return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const { initializeApp } = await import('firebase/app');
        const fs = await import('firebase/firestore');
        const app = initializeApp(config);
        return { db: fs.getFirestore(app), fs };
      } catch (err) {
        console.warn('[MotorGuard] Firebase init failed – falling back to localStorage.', err);
        return null;
      }
    })();
  }
  return dbPromise;
}
