import { OvertimeEntry, AppSettings } from '../types';

const API_BASE = '/api';

export const apiService = {
  // Entries
  async getEntries(): Promise<OvertimeEntry[]> {
    const response = await fetch(`${API_BASE}/entries`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao buscar registros');
    }
    return response.json();
  },

  async addEntry(entry: OvertimeEntry): Promise<OvertimeEntry> {
    const response = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao adicionar registro');
    }
    return response.json();
  },

  async updateEntry(id: string, entry: OvertimeEntry): Promise<OvertimeEntry> {
    const response = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar registro');
    }
    return response.json();
  },

  async deleteEntry(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao excluir registro');
    }
  },

  async clearEntries(): Promise<void> {
    const response = await fetch(`${API_BASE}/entries`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao limpar registros');
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings | null> {
    const response = await fetch(`${API_BASE}/settings`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao buscar configurações');
    }
    return response.json();
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao salvar configurações');
    }
    return response.json();
  },

};
