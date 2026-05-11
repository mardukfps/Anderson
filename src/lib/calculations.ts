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

/**
 * Calculates INSS deduction based on Brazilian progressive table (2024/2025 standard)
 */
export function calculateINSS(salary: number) {
  if (salary <= 0) return 0;
  
  const ceiling = 7786.02;
  const s = Math.min(salary, ceiling);
  
  let inss = 0;
  
  // 2024 Progressive Brackets
  if (s <= 1412.00) {
    inss = s * 0.075;
  } else if (s <= 2666.68) {
    inss = (1412.00 * 0.075) + ((s - 1412.00) * 0.09);
  } else if (s <= 4000.03) {
    inss = (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((s - 2666.68) * 0.12);
  } else {
    inss = (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((4000.03 - 2666.68) * 0.12) + ((s - 4000.03) * 0.14);
  }

  // Max deduction is capped by the ceiling
  return Math.min(inss, 908.85);
}

/**
 * Calculates IRRF (Imposto de Renda) based on Brazilian progressive table
 */
export function calculateIRRF(grossSalary: number, inssDeduction: number) {
  const taxableBase = grossSalary - inssDeduction;
  
  if (taxableBase <= 2259.20) return 0;
  
  let irrf = 0;
  if (taxableBase <= 2826.65) {
    irrf = (taxableBase * 0.075) - 169.44;
  } else if (taxableBase <= 3751.05) {
    irrf = (taxableBase * 0.15) - 381.44;
  } else if (taxableBase <= 4664.68) {
    irrf = (taxableBase * 0.225) - 662.77;
  } else {
    irrf = (taxableBase * 0.275) - 896.00;
  }

  return Math.max(0, irrf);
}

/**
 * Calculates FGTS (8% of gross salary)
 * Note: This is an employer cost, not a deduction from salary, 
 * but often tracked in balance sheets.
 */
export function calculateFGTS(grossSalary: number) {
  return grossSalary * 0.08;
}

/**
 * Calculates a complete net salary summary
 */
export function calculateSalarySummary(baseSalary: number, extraValue: number) {
  const totalGross = baseSalary + extraValue;
  const inss = calculateINSS(totalGross);
  const irrf = calculateIRRF(totalGross, inss);
  const fgts = calculateFGTS(totalGross);
  
  const totalDeductions = inss + irrf;
  const netSalary = totalGross - totalDeductions;
  
  return {
    totalGross,
    inss,
    irrf,
    fgts,
    totalDeductions,
    netSalary
  };
}
