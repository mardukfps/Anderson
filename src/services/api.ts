import { OvertimeEntry, AppSettings, DEFAULT_SETTINGS } from '../types';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const STORAGE_KEY_ENTRIES = 'horacerta_entries';
const STORAGE_KEY_SETTINGS = 'horacerta_settings';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

export const apiService = {
  // Entries
  async getEntries(userId: string): Promise<OvertimeEntry[]> {
    const path = `users/${userId}/entries`;
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data() as OvertimeEntry);
      // Safe localStorage usage
      try {
        localStorage.setItem(`${STORAGE_KEY_ENTRIES}_${userId}`, JSON.stringify(data));
      } catch (e) {
        console.warn('LocalStorage is full or restricted');
      }
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
      console.error('Error fetching entries:', error);
      try {
        const local = localStorage.getItem(`${STORAGE_KEY_ENTRIES}_${userId}`);
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    }
  },

  async addEntry(userId: string, entry: OvertimeEntry): Promise<OvertimeEntry> {
    const path = `users/${userId}/entries/${entry.id}`;
    try {
      await setDoc(doc(db, `users/${userId}/entries`, entry.id), {
        ...entry,
        userId,
        createdAt: serverTimestamp() // Use server-side time
      });
      return entry;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateEntry(userId: string, id: string, entry: OvertimeEntry): Promise<OvertimeEntry> {
    const path = `users/${userId}/entries/${id}`;
    try {
      await updateDoc(doc(db, `users/${userId}/entries`, id), { ...entry });
      return entry;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async deleteEntry(userId: string, id: string): Promise<void> {
    const path = `users/${userId}/entries/${id}`;
    try {
      await deleteDoc(doc(db, `users/${userId}/entries`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },

  async clearEntries(userId: string): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, `users/${userId}/entries`));
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      try {
        localStorage.removeItem(`${STORAGE_KEY_ENTRIES}_${userId}`);
      } catch (e) {}
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/entries`);
      throw error;
    }
  },

  // Settings
  async getSettings(userId: string): Promise<AppSettings | null> {
    const path = `users/${userId}/settings/config`;
    try {
      const docRef = doc(db, 'users', userId, 'settings', 'config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as AppSettings;
        try {
          localStorage.setItem(`${STORAGE_KEY_SETTINGS}_${userId}`, JSON.stringify(data));
        } catch (e) {}
        return data;
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.GET, path);
      }
      console.error('Error fetching settings:', error);
      try {
        const local = localStorage.getItem(`${STORAGE_KEY_SETTINGS}_${userId}`);
        return local ? JSON.parse(local) : DEFAULT_SETTINGS;
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
  },

  async saveSettings(userId: string, settings: AppSettings): Promise<AppSettings> {
    const path = `users/${userId}/settings/config`;
    try {
      // Sanitize: Only include fields allowed by security rules
      const sanitizedSettings = {
        baseHourlyRate: Number(settings.baseHourlyRate) || 0,
        baseSalary: Number(settings.baseSalary) || 0,
        monthlyLimit: Number(settings.monthlyLimit) || 0,
        defaultMultiplier: Number(settings.defaultMultiplier) || 2.0,
        theme: settings.theme || 'dark',
        userId: userId
      };
      
      await setDoc(doc(db, 'users', userId, 'settings', 'config'), sanitizedSettings);
      try {
        localStorage.setItem(`${STORAGE_KEY_SETTINGS}_${userId}`, JSON.stringify(sanitizedSettings));
      } catch (e) {}
      return sanitizedSettings as AppSettings;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  // Security & Cache
  async ensureUserProfile(userId: string, email: string, name: string) {
    const docRef = doc(db, 'users', userId);
    try {
      // Use getDocFromServer to avoid cache issues for the initial profile check
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: userId,
          email: email || '',
          name: name || 'Usuário',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      if (error instanceof Error && (error.message.includes('permission') || error.message.includes('insufficient'))) {
        handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
      }
      console.error('Error ensuring user profile:', error);
    }
  },

  async updateUserName(userId: string, newName: string) {
    const docRef = doc(db, 'users', userId);
    try {
      await updateDoc(docRef, { 
        name: newName,
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      throw error;
    }
  },

  async updateUserPhoto(userId: string, photoURL: string) {
    const docRef = doc(db, 'users', userId);
    try {
      await updateDoc(docRef, { 
        photoURL,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      throw error;
    }
  },

  async updatePasswordAudit(userId: string) {
    const docRef = doc(db, 'users', userId);
    try {
      await updateDoc(docRef, { 
        passwordLastChanged: serverTimestamp(),
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      console.error('Error logging password update:', error);
    }
  },

  clearCache(userId: string) {
    try {
      localStorage.removeItem(`${STORAGE_KEY_ENTRIES}_${userId}`);
      localStorage.removeItem(`${STORAGE_KEY_SETTINGS}_${userId}`);
    } catch (e) {}
  }
};
