import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { OvertimeEntry, EntryType, AppSettings } from '../types';
import { calculateEntryPerformance } from '../lib/calculations';
import { cn, formatExactHours, formatCurrency } from '../lib/utils';
import { Clock, Calendar, Percent, Tag, PlusCircle } from 'lucide-react';
import TimeInput from './TimeInput';

import CalendarInput from './CalendarInput';

interface EntryFormProps {
  onSubmit: (entry: OvertimeEntry) => void | Promise<void>;
  settings: AppSettings;
  initialEntry?: OvertimeEntry;
  onCancel?: () => void;
}

export default function EntryForm({ onSubmit, settings, initialEntry, onCancel }: EntryFormProps) {
  const [type, setType] = useState<EntryType>(initialEntry?.type || EntryType.PONTO);
  const [date, setDate] = useState(initialEntry?.date || new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState(initialEntry?.entryTime || '08:00');
  const [exitTime, setExitTime] = useState(initialEntry?.exitTime || '18:00');
  const [multiplier, setMultiplier] = useState<1.0 | 2.0>(initialEntry?.multiplier || settings.defaultMultiplier || 1.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ date?: boolean; entryTime?: boolean; exitTime?: boolean }>({});

  const stats = useMemo(() => 
    calculateEntryPerformance(entryTime, exitTime, multiplier, settings.baseHourlyRate),
  [entryTime, exitTime, multiplier, settings.baseHourlyRate]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!date) newErrors.date = true;
    if (!entryTime) newErrors.entryTime = true;
    if (!exitTime) newErrors.exitTime = true;
    
    // Check for logical consistency (exit after entry)
    if (entryTime && exitTime && entryTime >= exitTime) {
      newErrors.exitTime = true;
      newErrors.entryTime = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const entryData: OvertimeEntry = {
        id: initialEntry?.id || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)),
        type,
        date,
        entryTime,
        exitTime,
        multiplier,
        calculatedHours: stats.calculatedHours,
        calculatedValue: stats.calculatedValue,
        isNightShift: stats.isNightShift,
        createdAt: initialEntry?.createdAt || Date.now(),
      };

      // Ensure we await the result from the parent
      await onSubmit(entryData);
    } catch (err) {
      console.error('Submit error:', err);
      // Parent handle alert, but we reset state here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-8">
      {/* Type Selector */}
      <div className="flex bg-app-card p-1 rounded-2xl border border-app-border transition-colors">
        <button
          type="button"
          onClick={() => setType(EntryType.PONTO)}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
            type === EntryType.PONTO 
              ? "bg-app-accent text-app-accent-text shadow-md" 
              : "text-app-muted hover:text-app-text"
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
              ? "bg-app-accent text-app-accent-text shadow-md" 
              : "text-app-muted hover:text-app-text"
          )}
        >
          Cartão Manual
        </button>
      </div>

      <div className="space-y-6">
        {/* Date Input */}
        <motion.div 
          animate={errors.date ? { x: [-5, 5, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <CalendarInput 
            label="Data do Registro"
            value={date}
            onChange={(val) => {
              setDate(val);
              if (errors.date) setErrors(prev => ({ ...prev, date: false }));
            }}
            error={errors.date}
          />
        </motion.div>

        {/* Times Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div 
            animate={errors.entryTime ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <TimeInput 
              label="Entrada"
              value={entryTime}
              onChange={(val) => {
                setEntryTime(val);
                if (errors.entryTime) setErrors(prev => ({ ...prev, entryTime: false, exitTime: false }));
              }}
              error={errors.entryTime}
              iconColor="text-blue-500"
            />
          </motion.div>
          <motion.div 
            animate={errors.exitTime ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <TimeInput 
              label="Saída"
              value={exitTime}
              onChange={(val) => {
                setExitTime(val);
                if (errors.exitTime) setErrors(prev => ({ ...prev, exitTime: false, entryTime: false }));
              }}
              error={errors.exitTime}
              iconColor="text-orange-500"
            />
          </motion.div>
        </div>

        {/* Multiplier Selector */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
            <Percent className="w-3 h-3" /> Multiplicador da Hora
          </label>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setMultiplier(1.0)}
              className={cn(
                "p-4 rounded-3xl border transition-all flex flex-col items-center gap-2",
                multiplier === 1.0 
                  ? "border-app-accent bg-app-accent text-app-accent-text shadow-lg shadow-app-accent/20" 
                  : "border-app-border bg-app-card text-app-muted hover:border-app-accent/30"
              )}
            >
              <span className="text-2xl font-bold">50%</span>
              <span className="text-[10px] uppercase font-heavy tracking-widest opacity-70">Normal</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setMultiplier(2.0)}
              className={cn(
                "p-4 rounded-3xl border transition-all flex flex-col items-center gap-2",
                multiplier === 2.0 
                  ? "border-app-accent bg-app-accent text-app-accent-text shadow-lg shadow-app-accent/20" 
                  : "border-app-border bg-app-card text-app-muted hover:border-app-accent/30"
              )}
            >
              <span className="text-2xl font-bold">100%</span>
              <span className="text-[10px] uppercase font-heavy tracking-widest opacity-70">Dobro</span>
            </motion.button>
          </div>
        </div>

      </div>

       {/* Summary Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-app-card p-7 rounded-[3rem] space-y-6 shadow-2xl border border-app-border relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none text-app-accent">
          <Clock className="w-32 h-32" />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-app-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5">ESTIMATIVA</span>
            <div className="text-4xl font-black tracking-tighter text-app-accent flex items-baseline gap-1">
              <span className="text-lg opacity-40">R$</span>{formatCurrency(stats.calculatedValue).replace('R$', '').trim()}
            </div>
          </div>
          <div className="bg-emerald-500/10 p-4 rounded-[2rem] border border-emerald-500/20 text-emerald-600">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-app-border/40 relative z-10">
          <div>
            <span className="text-app-muted text-[9px] font-black uppercase tracking-widest block mb-1 opacity-60">Duração</span>
            <div className="text-xl font-black text-app-text tracking-tight">
              {formatExactHours(stats.realHours)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-app-muted text-[9px] font-black uppercase tracking-widest block mb-1 opacity-60">Adicional</span>
            <div className={cn(
              "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest inline-block",
              multiplier === 2.0 
                ? "bg-orange-100 text-orange-600" 
                : "bg-app-accent/10 text-app-accent"
            )}>
              {multiplier === 1.0 ? 'EXTRA 50%' : 'EXTRA 100%'}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-3">
        <motion.button
          type="submit"
          whileTap={!isSubmitting ? { scale: 0.95 } : {}}
          disabled={isSubmitting}
          className="w-full bg-app-accent text-app-accent-text py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-app-accent/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xs"
        >
          {isSubmitting ? <Clock className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-6 h-6 outline-none" />}
          {initialEntry ? 'Salvar Alterações' : 'Confirmar Registro'}
        </motion.button>
        
        {onCancel && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="w-full bg-transparent text-app-muted py-4 rounded-3xl font-black uppercase tracking-widest transition-all text-[9px] opacity-60 hover:opacity-100"
          >
            Cancelar e Voltar
          </motion.button>
        )}
      </div>
    </form>
  );
}
