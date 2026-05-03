import { OvertimeEntry, AppSettings } from '../types';

const API_BASE = '/api';

// Helper to check if server is available
async function isServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/entries`, { method: 'HEAD' });
    return res.status !== 404; // If 404, it might be a static host without /api
  } catch {
    return false;
  }
}

const STORAGE_KEY_ENTRIES = 'focusponto_entries';
const STORAGE_KEY_SETTINGS = 'focusponto_settings';

export const apiService = {
  // Entries
  async getEntries(): Promise<OvertimeEntry[]> {
    try {
      const response = await fetch(`${API_BASE}/entries`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      // Sync to local storage
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(data));
      return data;
    } catch (error) {
      console.warn('Using local storage for entries');
      const local = localStorage.getItem(STORAGE_KEY_ENTRIES);
      return local ? JSON.parse(local) : [];
    }
  },

  async addEntry(entry: OvertimeEntry): Promise<OvertimeEntry> {
    const localEntries = JSON.parse(localStorage.getItem(STORAGE_KEY_ENTRIES) || '[]');
    const updatedEntries = [entry, ...localEntries];
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(updatedEntries));

    try {
      const response = await fetch(`${API_BASE}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error();
      return await response.json();
    } catch (error) {
      console.warn('Saved entry locally only');
      return entry;
    }
  },

  async updateEntry(id: string, entry: OvertimeEntry): Promise<OvertimeEntry> {
    const localEntries = JSON.parse(localStorage.getItem(STORAGE_KEY_ENTRIES) || '[]');
    const updatedEntries = localEntries.map((e: any) => e.id === id ? entry : e);
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(updatedEntries));

    try {
      const response = await fetch(`${API_BASE}/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error();
      return await response.json();
    } catch (error) {
      console.warn('Updated entry locally only');
      return entry;
    }
  },

  async deleteEntry(id: string): Promise<void> {
    const localEntries = JSON.parse(localStorage.getItem(STORAGE_KEY_ENTRIES) || '[]');
    const updatedEntries = localEntries.filter((e: any) => e.id !== id);
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(updatedEntries));

    try {
      const response = await fetch(`${API_BASE}/entries/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error();
    } catch (error) {
      console.warn('Deleted entry locally only');
    }
  },

  async clearEntries(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY_ENTRIES);
    try {
      const response = await fetch(`${API_BASE}/entries`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error();
    } catch (error) {
      console.warn('Cleared entries locally only');
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings | null> {
    try {
      const response = await fetch(`${API_BASE}/settings`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data) localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data));
      return data;
    } catch (error) {
      console.warn('Using local storage for settings');
      const local = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return local ? JSON.parse(local) : null;
    }
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    try {
      const response = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error();
      return await response.json();
    } catch (error) {
      console.warn('Saved settings locally only');
      return settings;
    }
  },
};
