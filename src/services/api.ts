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
  orderBy
} from 'firebase/firestore';

const STORAGE_KEY_ENTRIES = 'jornadaplus_entries';
const STORAGE_KEY_SETTINGS = 'jornadaplus_settings';

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
      localStorage.setItem(`${STORAGE_KEY_ENTRIES}_${userId}`, JSON.stringify(data));
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
      console.error('Error fetching entries:', error);
      const local = localStorage.getItem(`${STORAGE_KEY_ENTRIES}_${userId}`);
      return local ? JSON.parse(local) : [];
    }
  },

  async addEntry(userId: string, entry: OvertimeEntry): Promise<OvertimeEntry> {
    const path = `users/${userId}/entries/${entry.id}`;
    try {
      await setDoc(doc(db, `users/${userId}/entries`, entry.id), {
        ...entry,
        userId
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
      localStorage.removeItem(`${STORAGE_KEY_ENTRIES}_${userId}`);
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
        localStorage.setItem(`${STORAGE_KEY_SETTINGS}_${userId}`, JSON.stringify(data));
        return data;
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.GET, path);
      }
      console.error('Error fetching settings:', error);
      const local = localStorage.getItem(`${STORAGE_KEY_SETTINGS}_${userId}`);
      return local ? JSON.parse(local) : DEFAULT_SETTINGS;
    }
  },

  async saveSettings(userId: string, settings: AppSettings): Promise<AppSettings> {
    const path = `users/${userId}/settings/config`;
    try {
      await setDoc(doc(db, 'users', userId, 'settings', 'config'), {
        ...settings,
        userId
      });
      localStorage.setItem(`${STORAGE_KEY_SETTINGS}_${userId}`, JSON.stringify(settings));
      return settings;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  // Mercado Pago
  async getAuthHeaders() {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");
    // Forçamos a atualização do token para evitar sessões expiradas em operações críticas
    const token = await user.getIdToken(true);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  },

  async createPlan(reason: string, amount: number) {
    const headers = await this.getAuthHeaders();
    const response = await fetch('/api/subscription/create-plan', {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason, amount })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao criar plano");
    return data;
  },

  async subscribe(planId: string, cardTokenId: string, payerEmail: string, reason?: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch('/api/subscription/subscribe', {
      method: 'POST',
      headers,
      body: JSON.stringify({ planId, cardTokenId, payerEmail, reason })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao criar assinatura");
    return data;
  },

  // Security & Cache
  async ensureUserProfile(userId: string, email: string, name: string) {
    const docRef = doc(db, 'users', userId);
    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: userId,
          email,
          name,
          createdAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  },

  clearCache(userId: string) {
    localStorage.removeItem(`${STORAGE_KEY_ENTRIES}_${userId}`);
    localStorage.removeItem(`${STORAGE_KEY_SETTINGS}_${userId}`);
    // Clear any other user-specific local storage here
  }
};
