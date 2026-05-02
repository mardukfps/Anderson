import React, { useState, useEffect } from 'react';
import { OvertimeEntry, EntryType, AppSettings } from '../types';
import { calculateEntryPerformance } from '../lib/calculations';
import { cn } from '../lib/utils';
import { Clock, Calendar, Percent, Tag, PlusCircle } from 'lucide-react';

interface EntryFormProps {
  onSubmit: (entry: OvertimeEntry) => void;
  settings: AppSettings;
  initialEntry?: OvertimeEntry;
  onCancel?: () => void;
}

export default function EntryForm({ onSubmit, settings, initialEntry, onCancel }: EntryFormProps) {
  const [type, setType] = useState<EntryType>(initialEntry?.type || EntryType.PONTO);
  const [date, setDate] = useState(initialEntry?.date || new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState(initialEntry?.entryTime || '08:00');
  const [exitTime, setExitTime] = useState(initialEntry?.exitTime || '18:00');
  const [percentage, setPercentage] = useState<0.5 | 1.0>(initialEntry?.percentage || settings.defaultPercentage || 0.5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = calculateEntryPerformance(entryTime, exitTime, percentage, settings.baseHourlyRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const entryData: OvertimeEntry = {
      id: initialEntry?.id || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)),
      type,
      date,
      entryTime,
      exitTime,
      percentage,
      calculatedHours: stats.calculatedHours,
      calculatedValue: stats.calculatedValue,
      createdAt: initialEntry?.createdAt || Date.now(),
    };

    // Small delay for feel
    setTimeout(() => {
      onSubmit(entryData);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-8">
      {/* Type Selector */}
      <div className="flex bg-gray-100 dark:bg-dark-card p-1 rounded-2xl border dark:border-white/5 transition-colors">
        <button
          type="button"
          onClick={() => setType(EntryType.PONTO)}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
            type === EntryType.PONTO 
              ? "bg-white dark:bg-white text-[#141414] dark:text-black shadow-md" 
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          Ponto Eletrônico
        </button>
        <button
          type="button"
          onClick={() => setType(EntryType.CARTAO)}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
            type === EntryType.CARTAO 
              ? "bg-white dark:bg-white text-[#141414] dark:text-black shadow-md" 
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          Cartão Manual
        </button>
      </div>

      <div className="space-y-4">
        {/* Date Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Data
          </label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white dark:bg-dark-card border border-gray-100 dark:border-white/5 p-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#141414]/10 dark:focus:ring-white/10 transition-all outline-none font-medium dark:text-white"
            required
          />
        </div>

        {/* Times Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3 text-blue-500" /> Entrada
            </label>
            <input 
              type="time" 
              value={entryTime} 
              onChange={(e) => setEntryTime(e.target.value)}
              className="w-full bg-white dark:bg-dark-card border border-gray-100 dark:border-white/5 p-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#141414]/10 dark:focus:ring-white/10 transition-all outline-none font-mono text-lg dark:text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3 text-orange-500" /> Saída
            </label>
            <input 
              type="time" 
              value={exitTime} 
              onChange={(e) => setExitTime(e.target.value)}
              className="w-full bg-white dark:bg-dark-card border border-gray-100 dark:border-white/5 p-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#141414]/10 dark:focus:ring-white/10 transition-all outline-none font-mono text-lg dark:text-white"
              required
            />
          </div>
        </div>

        {/* Percentage Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Percent className="w-3 h-3" /> Adicional
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPercentage(0.5)}
              className={cn(
                "p-4 rounded-2xl border transition-all flex flex-col items-center gap-1",
                percentage === 0.5 
                  ? "border-[#141414] dark:border-white bg-[#141414] dark:bg-white text-white dark:text-black" 
                  : "border-gray-100 dark:border-white/5 bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400"
              )}
            >
              <span className="text-xl font-bold">50%</span>
              <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">Normal</span>
            </button>
            <button
              type="button"
              onClick={() => setPercentage(1.0)}
              className={cn(
                "p-4 rounded-2xl border transition-all flex flex-col items-center gap-1",
                percentage === 1.0 
                  ? "border-[#141414] dark:border-white bg-[#141414] dark:bg-white text-white dark:text-black" 
                  : "border-gray-100 dark:border-white/5 bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400"
              )}
            >
              <span className="text-xl font-bold">100%</span>
              <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">Dobro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-[#141414] dark:bg-dark-card text-white p-6 rounded-3xl space-y-4 shadow-xl border dark:border-white/5">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Resumo do Lançamento</span>
          <Tag className="w-4 h-4 text-white/40" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest block">Duração</span>
            <div className="text-xl font-mono">{stats.calculatedHours.toFixed(1)}h</div>
          </div>
          <div className="text-right">
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest block">Valor Estimado</span>
            <div className="text-xl font-bold">R$ {stats.calculatedValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-white dark:bg-dark-card text-[#141414] dark:text-white py-5 rounded-2xl font-bold uppercase tracking-widest shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-gray-100 dark:border-white/5"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-[2] bg-[#141414] dark:bg-white text-white dark:text-black py-5 rounded-2xl font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
        >
          <PlusCircle className="w-6 h-6" />
          {initialEntry ? 'Salvar Edição' : 'Confirmar'}
        </button>
      </div>
    </form>
  );
}
