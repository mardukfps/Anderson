import { differenceInMinutes, parse } from 'date-fns';
import { OvertimeEntry, EntryType, AppSettings } from '../types';
import { timeStringToDecimal } from './utils';

/**
 * Calculates the overtime value and duration for a new entry
 */
export function calculateEntryPerformance(
  entryTime: string,
  exitTime: string,
  percentage: number,
  baseHourlyRate: number
) {
  const start = parse(entryTime, 'HH:mm', new Date());
  let end = parse(exitTime, 'HH:mm', new Date());

  // Handle shift crossing midnight
  if (end < start) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  const durationMinutes = differenceInMinutes(end, start);
  const durationHours = durationMinutes / 60;
  
  const additionalMultiplier = 1 + percentage;
  const entryValue = durationHours * baseHourlyRate * additionalMultiplier;

  return {
    calculatedHours: durationHours,
    calculatedValue: entryValue
  };
}
