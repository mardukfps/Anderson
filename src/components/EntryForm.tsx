import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { OvertimeEntry, EntryType, AppSettings } from '../types';
import { calculateEntryPerformance } from '../lib/calculations';
import { cn, formatExactHours, formatCurrency, getBrazilDate } from '../lib/utils';
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
  const [date, setDate] = useState(initialEntry?.date || getBrazilDate());
  const [entryTime, setEntryTime] = useState(initialEntry?.entryTime || '08:00');
  const [exitTime, setExitTime] = useState(initialEntry?.exitTime || '18:00');
  const [multiplier, setMultiplier] = useState<1.0 | 2.0>(initialEntry?.multiplier || settings.defaultMultiplier || 1.0);
  const [notes, setNotes] = useState(initialEntry?.notes || '');
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
        notes,
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

        {/* Notes Input */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
            <PlusCircle className="w-3 h-3" /> Observações (Opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Reunião de emergência, Deploy produção..."
            className="w-full bg-app-card border border-app-border rounded-[24px] p-4 text-sm text-app-text placeholder:text-app-muted focus:outline-none focus:border-app-accent min-h-[100px] resize-none transition-all"
          />
        </div>
      </div>

      {/* Summary Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-app-card p-6 rounded-[32px] space-y-4 shadow-xl border border-app-border relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <PlusCircle className="w-32 h-32" />
        </div>
        
        <div className="flex justify-between items-center border-b border-app-border pb-4">
          <span className="text-app-muted text-xs font-bold uppercase tracking-widest">Resumo do Lançamento</span>
          <div className="p-2 bg-app-accent/10 rounded-xl text-app-accent">
            <Tag className="w-4 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div>
            <span className="text-app-muted text-[10px] font-bold uppercase tracking-widest block mb-1">Duração Total</span>
            <div className="text-2xl font-mono text-app-text font-bold leading-none">
              {formatExactHours(stats.realHours)}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="px-1.5 py-0.5 rounded-md bg-app-accent/10 text-app-accent text-[9px] font-black uppercase">
                {multiplier === 1.0 ? 'Hora Extra 50%' : 'Hora Extra 100%'}
              </span>
            </div>
          </div>
          <div className="text-right flex flex-col justify-end">
            <span className="text-app-muted text-[10px] font-bold uppercase tracking-widest block mb-1">Valor Total ({multiplier === 1.0 ? '50%' : '100%'})</span>
            <div className="text-2xl font-bold text-app-accent leading-none">
              {formatCurrency(stats.calculatedValue)}
            </div>
            <span className="text-[9px] text-app-muted font-medium mt-1">
              Base: {formatCurrency(settings?.baseHourlyRate || 0)}/h
            </span>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-4">
        {onCancel && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="flex-1 bg-app-card text-app-text py-5 rounded-3xl font-bold uppercase tracking-widest shadow-sm hover:bg-app-bg transition-all border border-app-border text-[10px]"
          >
            Voltar
          </motion.button>
        )}
        <motion.button
          type="submit"
          whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : {}}
          whileTap={!isSubmitting ? { scale: 0.98 } : {}}
          disabled={isSubmitting}
          className="flex-[2] bg-app-accent text-app-accent-text py-5 rounded-3xl font-bold uppercase tracking-widest shadow-lg shadow-app-accent/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-[10px]"
        >
          {isSubmitting ? <Clock className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
          {initialEntry ? 'Salvar Alterações' : 'Registrar Agora'}
        </motion.button>
      </div>
    </form>
  );
}
