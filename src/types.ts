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
  multiplier: 1.0 | 2.0;
  calculatedValue: number;
  notes?: string;
  isNightShift?: boolean;
  createdAt: number;
}

export type Theme = 'light' | 'dark' | 'high-contrast' | 'sky' | 'ruby' | 'emerald' | 'amber';

export type UserPlan = 'free' | 'premium';

export interface AppSettings {
  baseHourlyRate: number;
  monthlyLimit: number;
  defaultMultiplier: 1.0 | 2.0;
  theme: Theme;
  plan: UserPlan;
  subscriptionExpiresAt?: number;
  autoRenew?: boolean;
  subscriptionStatus?: 'pending' | 'confirmed';
  baseSalary: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  baseHourlyRate: 0,
  monthlyLimit: 40,
  defaultMultiplier: 2.0,
  theme: 'dark',
  plan: 'free',
  baseSalary: 0,
};
