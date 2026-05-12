import { parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a YYYY-MM-DD string into a Date object safely by setting noon time.
 * This prevents timezone drift errors where a date might show as the previous day.
 */
export function parseLocalDate(dateStr: string): Date {
  return parseISO(`${dateStr}T12:00:00`);
}

/**
 * Converts HH:mm string to decimal hours
 * Example: "01:30" -> 1.5
 */
export function timeStringToDecimal(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + (minutes / 60);
}

/**
 * Converts decimal hours to HH:mm string
 * Example: 1.5 -> "01:30"
 */
export function decimalToTimeString(decimal: number): string {
  const totalMinutes = Math.round(decimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Formata horas decimais em uma string legível (ex: 1.25 -> "1h 15m")
 */
export function formatExactHours(decimal: number): string {
  const totalMinutes = Math.round(decimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0 && minutes === 0) return "0h";
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Formats a number as currency (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Retorna a data atual no fuso horário de Brasília (UTC-3) no formato YYYY-MM-DD.
 * Isso garante que a virada do dia ocorra exatamente à meia-noite de Brasília.
 */
export function getBrazilDate(): string {
  const now = new Date();
  // Brasília é UTC-3. 
  // O método toLocaleDateString com o timeZone correto é a forma mais robusta.
  const formatter = new Intl.DateTimeFormat('sv-SE', { // sv-SE usa formato ISO YYYY-MM-DD
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
}
