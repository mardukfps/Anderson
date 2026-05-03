import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Check
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface CalendarInputProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  error?: boolean;
}

export default function CalendarInput({ label, value, onChange, error }: CalendarInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(parseISO(value));
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync view date when value changes or when opening
  useEffect(() => {
    setViewDate(parseISO(value));
  }, [value, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDateSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const nextMonth = () => setViewDate(addMonths(viewDate, 1));
  const prevMonth = () => setViewDate(subMonths(viewDate, 1));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="relative" ref={containerRef}>
      <label className={cn(
        "text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2 transition-colors",
        error ? "text-rose-500" : "text-app-muted"
      )}>
        <CalendarIcon className="w-3 h-3" /> {label}
      </label>
      
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-app-card border p-4 rounded-2xl shadow-sm transition-all outline-none flex items-center justify-between group",
          error ? "border-rose-500/50 ring-2 ring-rose-500/10" : "border-app-border focus:ring-2 focus:ring-app-accent/10",
          isOpen && "ring-2 ring-app-accent/20 border-app-accent/50"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg bg-app-bg transition-colors",
            isOpen ? "text-app-accent" : "text-app-muted group-hover:text-app-accent"
          )}>
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-black uppercase text-app-muted tracking-tighter leading-none mb-0.5 opacity-60">
              {format(parseISO(value), 'MMMM yyyy', { locale: ptBR })}
            </span>
            <span className="font-sans text-lg text-app-text font-bold tracking-tight">
              {format(parseISO(value), "dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-app-muted transition-transform", isOpen && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-app-card border border-app-border rounded-[32px] shadow-2xl z-[100] overflow-hidden backdrop-blur-xl"
          >
            <div className="p-5">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-app-accent leading-none mb-1">
                    {format(viewDate, 'yyyy')}
                  </span>
                  <span className="text-xl font-bold text-app-text capitalize">
                    {format(viewDate, 'MMMM', { locale: ptBR })}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-2 rounded-xl bg-app-bg border border-app-border text-app-muted hover:text-app-accent transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-2 rounded-xl bg-app-bg border border-app-border text-app-muted hover:text-app-accent transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-[9px] font-black text-app-muted uppercase tracking-widest py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  const isSelected = isSameDay(day, parseISO(value));
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isTodayActive = isToday(day);

                  return (
                    <button
                      key={day.toString()}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        "aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all relative",
                        !isCurrentMonth && "text-app-muted opacity-20",
                        isCurrentMonth && !isSelected && "text-app-text hover:bg-app-bg hover:scale-110",
                        isSelected && "bg-app-accent text-app-accent-text shadow-lg shadow-app-accent/20 scale-110 z-10",
                        isTodayActive && !isSelected && "text-app-accent bg-app-accent/5 ring-1 ring-app-accent/20"
                      )}
                    >
                      {format(day, 'd')}
                      {isTodayActive && !isSelected && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-app-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick selectors or footer if needed */}
            <div className="bg-app-bg/50 p-3 border-t border-app-border flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleDateSelect(new Date())}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-app-accent hover:bg-app-accent/5 rounded-lg transition-all"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-app-muted hover:bg-app-bg rounded-lg transition-all"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
