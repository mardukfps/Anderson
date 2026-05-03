import { OvertimeEntry, AppSettings } from '../types';

const API_BASE = '/api';

export const apiService = {
  async getEntries(): Promise<OvertimeEntry[]> {
    const response = await fetch(`${API_BASE}/entries`);
    if (!response.ok) throw new Error('Failed to fetch entries');
    return response.json();
  },

  async addEntry(entry: OvertimeEntry): Promise<OvertimeEntry> {
    const response = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) throw new Error('Failed to add entry');
    return response.json();
  },

  async updateEntry(id: string, entry: OvertimeEntry): Promise<OvertimeEntry> {
    const response = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) throw new Error('Failed to update entry');
    return response.json();
  },

  async deleteEntry(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete entry');
  },

  async clearEntries(): Promise<void> {
    const response = await fetch(`${API_BASE}/entries`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear entries');
  },

  async getSettings(): Promise<AppSettings | null> {
    const response = await fetch(`${API_BASE}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to save settings');
    return response.json();
  },
};
