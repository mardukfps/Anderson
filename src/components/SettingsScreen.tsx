import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AppSettings } from '../types';
import { 
  Settings as SettingsIcon, DollarSign, Target, Save, Clock, Trash2, 
  Percent, Palette, Moon, Sun, Monitor
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiService } from '../services/api';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onThemePreview: (theme: string) => void;
}

export default function SettingsScreen({ settings, onUpdate, onThemePreview }: SettingsScreenProps) {
  const [baseHourlyRate, setBaseHourlyRate] = useState(settings.baseHourlyRate?.toString() || '0');
  const [monthlyLimit, setMonthlyLimit] = useState(settings.monthlyLimit?.toString() || '40');
  const [dailyWorkload, setDailyWorkload] = useState(settings.dailyWorkload?.toString() || '8');
  const [defaultPercentage, setDefaultPercentage] = useState<0.5 | 1.0>(settings.defaultPercentage || 0.5);
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [saved, setSaved] = useState(false);

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
    setDailyWorkload(settings.dailyWorkload?.toString() || '8');
    setDefaultPercentage(settings.defaultPercentage || 0.5);
    setTheme(settings.theme || 'dark');
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...settings,
      baseHourlyRate: parseFloat(baseHourlyRate) || 0,
      monthlyLimit: parseInt(monthlyLimit) || 40,
      dailyWorkload: parseFloat(dailyWorkload) || 8,
      defaultPercentage,
      theme: theme as any,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          
          {/* Base Rate */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="w-3 h-3" /> Valor da Hora Base (R$)
            </label>
            <input 
              type="number" 
              step="0.01"
              value={baseHourlyRate} 
              onChange={(e) => setBaseHourlyRate(e.target.value)}
              className="w-full bg-app-bg border border-app-border p-4 rounded-2xl focus:ring-2 focus:ring-app-accent/10 transition-all outline-none font-bold text-xl text-app-text"
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3 text-app-accent" /> Carga Horária Diária (Horas)
            </label>
            <input 
              type="number" 
              step="0.5"
              value={dailyWorkload} 
              onChange={(e) => setDailyWorkload(e.target.value)}
              className="w-full bg-app-bg border border-app-border p-4 rounded-2xl focus:ring-2 focus:ring-app-accent/10 transition-all outline-none font-bold text-xl text-app-text"
              placeholder="8.0"
            />
            <p className="text-[9px] text-app-muted font-medium italic mt-1">
              * Suas horas padrão de trabalho (ex: 8.0, 9.0).
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
              <Target className="w-3 h-3" /> Limite Mensal (Horas Extras)
            </label>
            <input 
              type="number" 
              value={monthlyLimit} 
              onChange={(e) => setMonthlyLimit(e.target.value)}
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

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          type="submit"
          className={cn(
            "w-full py-5 rounded-2xl font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3",
            saved ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-app-accent text-app-accent-text"
          )}
        >
          {saved ? "Configurações Salvas!" : <><Save className="w-6 h-6" /> Salvar Preferências</>}
        </motion.button>
      </form>
    </div>
  );
}
