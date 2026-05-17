import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with experimentalForceLongPolling for better stability in proxied environments
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || undefined);

export async function testConnection() {
  try {
    // Try to reach the server to verify configuration
    await getDocFromServer(doc(db, '_connection_test_', 'test'));
    console.log("Firebase connection successful");
  } catch (error: any) {
    const isSuccess = error?.code === 'not-found' || 
                      error?.code === 'permission-denied' || 
                      error?.message?.includes('permissions');

    if (isSuccess) {
      console.log("Firebase connection established (Server reachable)");
    } else if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.error("Firebase is offline. Check connection.");
    } else {
      console.error("Firebase connection test failed:", error.message || error);
    }
  }
}
