import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface TimeInputProps {
  label: string;
  value: string; // HH:mm format
  onChange: (value: string) => void;
  error?: boolean;
  icon?: React.ReactNode;
  iconColor?: string;
}

export default function TimeInput({ label, value, onChange, error, icon, iconColor }: TimeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempHours, setTempHours] = useState(value.split(':')[0]);
  const [tempMinutes, setTempMinutes] = useState(value.split(':')[1]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync temp values when value prop changes or when opening
  useEffect(() => {
    const [h, m] = value.split(':');
    setTempHours(h);
    setTempMinutes(m);
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

  const handleConfirm = () => {
    onChange(`${tempHours}:${tempMinutes}`);
    setIsOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const adjustValue = (type: 'h' | 'm', delta: number) => {
    if (type === 'h') {
      const current = parseInt(tempHours);
      const next = (current + delta + 24) % 24;
      setTempHours(next.toString().padStart(2, '0'));
    } else {
      const current = parseInt(tempMinutes);
      const next = (current + delta + 60) % 60;
      setTempMinutes(next.toString().padStart(2, '0'));
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className={cn(
        "text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2 transition-colors",
        error ? "text-rose-500" : "text-app-muted"
      )}>
        {icon || <Clock className="w-3 h-3" />} {label}
      </label>
      
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-app-card border p-4 rounded-2xl shadow-sm transition-all outline-none flex items-center justify-between",
          error ? "border-rose-500/50 ring-2 ring-rose-500/10" : "border-app-border focus:ring-2 focus:ring-app-accent/10",
          isOpen && "ring-2 ring-app-accent/20 border-app-accent/50"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-app-bg", iconColor || "text-app-accent")}>
            <Clock className="w-4 h-4" />
          </div>
          <span className="font-mono text-xl text-app-text tracking-wider">{value}</span>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-app-muted transition-transform", isOpen && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-app-card border border-app-border rounded-3xl shadow-2xl z-[100] overflow-hidden backdrop-blur-xl"
          >
            <div className="p-4 flex flex-col items-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                {/* Hours Picker */}
                <div className="flex flex-col items-center gap-2">
                  <button type="button" onClick={() => adjustValue('h', 1)} className="p-2 text-app-accent hover:bg-app-accent/10 rounded-xl transition-colors">
                    <ChevronUp className="w-6 h-6" />
                  </button>
                  <div className="w-16 h-16 flex items-center justify-center bg-app-bg rounded-2xl border border-app-border text-3xl font-mono font-bold text-app-text">
                    {tempHours}
                  </div>
                  <button type="button" onClick={() => adjustValue('h', -1)} className="p-2 text-app-accent hover:bg-app-accent/10 rounded-xl transition-colors">
                    <ChevronDown className="w-6 h-6" />
                  </button>
                </div>

                <div className="text-3xl font-bold text-app-muted pt-4">:</div>

                {/* Minutes Picker */}
                <div className="flex flex-col items-center gap-2">
                  <button type="button" onClick={() => adjustValue('m', 5)} className="p-2 text-app-accent hover:bg-app-accent/10 rounded-xl transition-colors">
                    <ChevronUp className="w-6 h-6" />
                  </button>
                  <div className="w-16 h-16 flex items-center justify-center bg-app-bg rounded-2xl border border-app-border text-3xl font-mono font-bold text-app-text">
                    {tempMinutes}
                  </div>
                  <button type="button" onClick={() => adjustValue('m', -5)} className="p-2 text-app-accent hover:bg-app-accent/10 rounded-xl transition-colors">
                    <ChevronDown className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest text-app-muted hover:bg-app-bg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest bg-app-accent text-app-accent-text shadow-lg flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Aplicar
                </button>
              </div>
            </div>

            {/* Quick Grid for common times */}
            <div className="bg-app-bg/50 p-4 border-t border-app-border grid grid-cols-4 gap-2">
              {['08:00', '09:00', '12:00', '13:00', '17:00', '18:00', '19:00', '22:00'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    const [h, m] = t.split(':');
                    setTempHours(h);
                    setTempMinutes(m);
                  }}
                  className={cn(
                    "py-2 text-[10px] font-bold rounded-lg border border-app-border transition-all",
                    tempHours === t.split(':')[0] && tempMinutes === t.split(':')[1]
                     ? "bg-app-accent text-app-accent-text border-app-accent"
                     : "bg-app-card text-app-muted hover:border-app-accent/50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
