export enum EntryType {
  PONTO = 'ponto',
  CARTAO = 'cartao',
}

export interface OvertimeEntry {
  id: string;
  type: EntryType;
  date: string; // ISO format YYYY-MM-DD
  entryTime: string; // HH:mm
  exitTime: string; // HH:mm
  calculatedHours: number; // decimal
  percentage: 0.5 | 1.0;
  calculatedValue: number;
  createdAt: number;
}

export type Theme = 'light' | 'dark' | 'high-contrast';

export interface AppSettings {
  baseHourlyRate: number;
  monthlyLimit: number;
  defaultPercentage: 0.5 | 1.0;
  theme: Theme;
  dailyWorkload: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  baseHourlyRate: 0,
  monthlyLimit: 40,
  defaultPercentage: 0.5,
  theme: 'dark',
  dailyWorkload: 8.0,
};
