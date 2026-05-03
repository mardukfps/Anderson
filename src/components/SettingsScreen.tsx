import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  onThemePreview: (theme: string) => void;
  onClearHistory: () => void;
}

export default function SettingsScreen({ settings, onUpdate, onThemePreview, onClearHistory }: SettingsScreenProps) {
  const [baseHourlyRate, setBaseHourlyRate] = useState(settings.baseHourlyRate?.toString() || '0');
  const [monthlyLimit, setMonthlyLimit] = useState(settings.monthlyLimit?.toString() || '40');
  const [defaultPercentage, setDefaultPercentage] = useState<0.5 | 1.0>(settings.defaultPercentage || 0.5);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [saved, setSaved] = useState(false);

  // Check if there are unsaved changes
  const hasChanges = (
    (Number(baseHourlyRate.toString().replace(',', '.')) || 0) !== (settings.baseHourlyRate || 0) ||
    (Number(monthlyLimit.toString().replace(',', '.')) || 0) !== (settings.monthlyLimit || 0) ||
    defaultPercentage !== (settings.defaultPercentage || 0.5) ||
    theme !== (settings.theme || 'dark')
  );

  // Apply theme immediately for preview
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(theme);
    
    if (theme !== settings.theme) {
      onThemePreview(theme);
    }
  }, [theme, settings.theme]);

  // Sync with prop if it changes (e.g. after initial fetch)
  React.useEffect(() => {
    setBaseHourlyRate(settings.baseHourlyRate?.toString() || '0');
    setMonthlyLimit(settings.monthlyLimit?.toString() || '40');
    setDefaultPercentage(settings.defaultPercentage || 0.5);
    setTheme(settings.theme || 'dark');
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updatedSettings: AppSettings = {
        ...settings,
        baseHourlyRate: Number(baseHourlyRate.toString().replace(',', '.')) || 0,
        monthlyLimit: Number(monthlyLimit.toString().replace(',', '.')) || 0,
        defaultPercentage,
        theme: theme as any,
      };
      
      console.log('Saving settings:', updatedSettings);
      await onUpdate(updatedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      alert(`Erro ao salvar configurações: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      <form onSubmit={handleSave} className="space-y-6">
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

        <AnimatePresence>
          {(hasChanges || isSaving || saved) && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              type="submit"
              disabled={isSaving}
              className={cn(
                "w-full py-5 rounded-2xl font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3",
                saved 
                  ? "bg-emerald-500 text-white shadow-emerald-200" 
                  : isSaving 
                    ? "bg-app-muted text-app-text opacity-50 cursor-not-allowed"
                    : "bg-app-accent text-app-accent-text"
              )}
            >
              {saved ? (
                "Configurações Salvas!"
              ) : isSaving ? (
                "Salvando..."
              ) : (
                <>
                  <Save className="w-6 h-6" /> 
                  Salvar Preferências
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
