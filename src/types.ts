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
  multiplier: number;
  calculatedValue: number;
  notes?: string;
  isNightShift?: boolean;
  nightHours?: number;
  createdAt: number;
}

export type Theme = 'light' | 'dark' | 'high-contrast' | 'sky' | 'ruby' | 'emerald' | 'amber';

export interface AppSettings {
  baseHourlyRate: number;
  monthlyLimit: number;
  defaultMultiplier: number;
  theme: Theme;
  baseSalary: number;
  userId?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  baseHourlyRate: 0,
  monthlyLimit: 40,
  defaultMultiplier: 1.5,
  theme: 'dark',
  baseSalary: 0,
};
