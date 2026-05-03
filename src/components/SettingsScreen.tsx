import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { AppSettings } from '../types';
import { 
  Settings as SettingsIcon, DollarSign, Target, Save, Clock, Trash2, 
  Percent, Palette, Moon, Sun, Monitor, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiService } from '../services/api';
import ConfirmationModal from './ConfirmationModal';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => Promise<void>;
  onPendingChanges: (settings: AppSettings | null) => void;
  onThemePreview: (theme: string) => void;
  onClearHistory: () => void;
}

export default function SettingsScreen({ settings, onUpdate, onPendingChanges, onThemePreview, onClearHistory }: SettingsScreenProps) {
  const [baseHourlyRate, setBaseHourlyRate] = useState(settings.baseHourlyRate?.toString() || '0');
  const [monthlyLimit, setMonthlyLimit] = useState(settings.monthlyLimit?.toString() || '40');
  const [defaultPercentage, setDefaultPercentage] = useState<0.5 | 1.0>(settings.defaultPercentage || 0.5);
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Parse strings to numbers for comparison and saving
  const currentBaseRate = useMemo(() => {
    const cleaned = baseHourlyRate.toString().replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }, [baseHourlyRate]);

  const currentMonthlyLimit = useMemo(() => {
    const num = parseInt(monthlyLimit.toString(), 10);
    return isNaN(num) ? 0 : num;
  }, [monthlyLimit]);

  // Track if changes are present
  const isDirty = useMemo(() => {
    return theme !== settings.theme || 
           currentBaseRate !== settings.baseHourlyRate || 
           currentMonthlyLimit !== settings.monthlyLimit ||
           defaultPercentage !== settings.defaultPercentage;
  }, [theme, currentBaseRate, currentMonthlyLimit, defaultPercentage, settings]);

  // Apply theme immediately for preview
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(theme);
    
    onThemePreview(theme);
  }, [theme]);

  // Report pending changes to parent
  useEffect(() => {
    if (isDirty) {
      onPendingChanges({
        ...settings,
        baseHourlyRate: currentBaseRate,
        monthlyLimit: currentMonthlyLimit,
        defaultPercentage,
        theme: theme as any
      });
    } else {
      onPendingChanges(null);
    }
  }, [isDirty, theme, currentBaseRate, currentMonthlyLimit, defaultPercentage, settings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty || isSaving) return;

    try {
      setIsSaving(true);
      const updatedSettings: AppSettings = {
        ...settings,
        baseHourlyRate: currentBaseRate,
        monthlyLimit: currentMonthlyLimit,
        defaultPercentage,
        theme: theme as any,
      };
      
      await onUpdate(updatedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Sync with prop if it changes externally
  useEffect(() => {
    if (!isDirty) {
      setBaseHourlyRate(settings.baseHourlyRate?.toString() || '0');
      setMonthlyLimit(settings.monthlyLimit?.toString() || '40');
      setDefaultPercentage(settings.defaultPercentage || 0.5);
      setTheme(settings.theme || 'dark');
    }
  }, [settings, isDirty]);

  return (
    <div className="space-y-6 pb-12 text-left">
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-app-card p-6 rounded-3xl space-y-6 shadow-sm border border-app-border"
        >
          <div className="flex justify-between items-center border-b border-app-border pb-2">
            <h3 className="text-sm font-bold text-app-text">Gerais</h3>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="w-3 h-3" /> Valor da Hora Base (R$)
            </label>
            <input 
              type="text" 
              inputMode="decimal"
              value={baseHourlyRate} 
              onChange={(e) => setBaseHourlyRate(e.target.value.replace(/[^0-9,.]/g, ''))}
              className="w-full bg-app-bg border border-app-border p-4 rounded-2xl focus:ring-2 focus:ring-app-accent/10 transition-all outline-none font-bold text-xl text-app-text"
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
              <Target className="w-3 h-3" /> Limite Mensal (Horas Extras)
            </label>
            <input 
              type="text" 
              inputMode="numeric"
              value={monthlyLimit} 
              onChange={(e) => setMonthlyLimit(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-app-bg border border-app-border p-4 rounded-2xl focus:ring-2 focus:ring-app-accent/10 transition-all outline-none font-bold text-xl text-app-text"
              placeholder="40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
              <Percent className="w-3 h-3" /> Porcentagem Padrão (HE)
            </label>
            <div className="flex gap-2">
              {[0.5, 1.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDefaultPercentage(val as 0.5 | 1.0)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all border",
                    defaultPercentage === val 
                      ? "bg-app-accent text-app-accent-text border-transparent" 
                      : "bg-app-bg text-app-muted border-app-border"
                  )}
                >
                  {val === 0.5 ? '50%' : '100%'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
              <Palette className="w-3 h-3" /> Tema do Aplicativo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Claro', icon: Sun },
                { id: 'dark', label: 'Escuro', icon: Moon },
                { id: 'high-contrast', label: 'Contraste', icon: Monitor },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all gap-2",
                    theme === t.id 
                      ? "bg-app-accent text-app-accent-text border-transparent shadow-lg" 
                      : "bg-app-bg text-app-muted border-app-border"
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Action Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-app-card p-6 rounded-3xl space-y-4 shadow-sm border border-app-border"
        >
          <div className="flex justify-between items-center border-b border-app-border pb-2 mb-2">
            <h3 className="text-sm font-bold text-app-text">Ações</h3>
          </div>

          <button
            type="button"
            onClick={onClearHistory}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-red-500/5 border border-red-500/10 rounded-2xl hover:bg-red-500 text-red-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Todo Histórico
          </button>
        </motion.div>

        {isDirty && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="bg-app-accent/10 p-5 rounded-3xl border border-app-accent/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-app-accent" />
                <p className="text-[10px] font-black uppercase tracking-widest text-app-text">Alterações pendentes</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSave()}
              disabled={isSaving}
              className={cn(
                "w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all flex items-center justify-center gap-3",
                saved 
                  ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                  : isSaving 
                    ? "bg-app-muted text-app-text opacity-50 cursor-not-allowed"
                    : "bg-app-accent text-app-accent-text shadow-app-accent/40"
              )}
            >
              {saved ? (
                "Configurações Salvas!"
              ) : isSaving ? (
                "Salvando..."
              ) : (
                <>
                  <Save className="w-5 h-5" /> 
                  Salvar Agora
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
