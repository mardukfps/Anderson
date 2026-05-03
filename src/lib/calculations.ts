import { differenceInMinutes, parse } from 'date-fns';
import { OvertimeEntry, EntryType, AppSettings } from '../types';
import { timeStringToDecimal } from './utils';

/**
 * Calculates the overtime value and duration for a new entry
 */
export function calculateEntryPerformance(
  entryTime: string,
  exitTime: string,
  multiplier: number,
  baseHourlyRate: number
) {
  const start = parse(entryTime, 'HH:mm', new Date());
  let end = parse(exitTime, 'HH:mm', new Date());

  // Tratar virada de meia-noite
  if (end < start) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  const durationMinutes = differenceInMinutes(end, start);
  const durationHours = durationMinutes / 60;
  
  // Cálculo Direto: (Valor da Hora) * (Multiplicador) * (Duração em Horas)
  const rawValue = (durationMinutes * baseHourlyRate * multiplier) / 60;
  const entryValue = Math.round(rawValue * 100) / 100;

  return {
    realHours: Number(durationHours.toFixed(4)),
    calculatedHours: Number(durationHours.toFixed(4)), 
    calculatedValue: entryValue,
    bonusMultiplier: multiplier,
    isNightShift: false
  };
}
