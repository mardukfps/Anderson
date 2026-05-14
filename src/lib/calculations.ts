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
 * Calculates INSS deduction based on Brazilian progressive table (2026 Projection)
 * Based on projected Minimum Wage of R$ 1.582,00
 */
export function calculateINSS(salary: number) {
  if (salary <= 0) return 0;
  
  const sm = 1582.00; // Salário Mínimo 2026
  const ceiling = 8723.46; // Teto INSS 2026 (Estimated)
  const s = Math.min(salary, ceiling);
  
  let inss = 0;
  
  // 2026 Progressive Brackets (Estimated)
  const b1 = sm;
  const b2 = 2987.75;
  const b3 = 4481.63;
  
  if (s <= b1) {
    inss = s * 0.075;
  } else if (s <= b2) {
    inss = (b1 * 0.075) + ((s - b1) * 0.09);
  } else if (s <= b3) {
    inss = (b1 * 0.075) + ((b2 - b1) * 0.09) + ((s - b2) * 0.12);
  } else {
    inss = (b1 * 0.075) + ((b2 - b1) * 0.09) + ((b3 - b2) * 0.12) + ((s - b3) * 0.14);
  }

  // Max deduction is capped by the ceiling (~R$ 1.018,30)
  return Math.min(inss, 1018.30);
}

/**
 * Calculates IRRF (Imposto de Renda) based on Brazilian progressive table (2026 Projection)
 * Includes progressive brackets and the "simplified deduction" logic
 */
export function calculateIRRF(grossSalary: number, inssDeduction: number) {
  const taxableBase = grossSalary - inssDeduction;
  
  // Proj 2026 Brackets (Exemption follows SM growth or specific laws)
  // Scaling 2024 table (2259.20 * 1.582/1412)
  const exemption = 2531.20;
  
  if (taxableBase <= exemption) return 0;
  
  let irrf = 0;
  if (taxableBase <= 3166.98) {
    irrf = (taxableBase * 0.075) - 189.84;
  } else if (taxableBase <= 4202.68) {
    irrf = (taxableBase * 0.15) - 427.37;
  } else if (taxableBase <= 5226.31) {
    irrf = (taxableBase * 0.225) - 742.57;
  } else {
    irrf = (taxableBase * 0.275) - 1003.88;
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
