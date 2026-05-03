import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AppSettings } from '../types';
import { Settings as SettingsIcon, DollarSign, Target, Save, Clock, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onClearData: () => void;
}

export default function SettingsScreen({ settings, onUpdate, onClearData }: SettingsScreenProps) {
  const [baseHourlyRate, setBaseHourlyRate] = useState(settings.baseHourlyRate?.toString() || '0');
  const [monthlyLimit, setMonthlyLimit] = useState(settings.monthlyLimit?.toString() || '40');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...settings,
      baseHourlyRate: parseFloat(baseHourlyRate) || 0,
      monthlyLimit: parseInt(monthlyLimit) || 0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <form onSubmit={handleSave} className="space-y-6 text-left">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-card p-6 rounded-3xl space-y-6 shadow-sm border border-gray-100 dark:border-white/5"
        >
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Gerais</h3>
          </div>
          
          {/* Base Rate */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="w-3 h-3" /> Valor da Hora Base (R$)
            </label>
            <input 
              type="number" 
              step="0.01"
              value={baseHourlyRate} 
              onChange={(e) => setBaseHourlyRate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-transparent p-4 rounded-2xl focus:ring-2 focus:ring-[#141414]/10 dark:focus:ring-white/10 transition-all outline-none font-bold text-xl dark:text-white"
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-3 h-3" /> Limite Mensal (Horas)
            </label>
            <input 
              type="number" 
              value={monthlyLimit} 
              onChange={(e) => setMonthlyLimit(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-transparent p-4 rounded-2xl focus:ring-2 focus:ring-[#141414]/10 dark:focus:ring-white/10 transition-all outline-none font-bold text-xl dark:text-white"
              placeholder="40"
            />
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          type="submit"
          className={cn(
            "w-full py-5 rounded-2xl font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3",
            saved ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-[#141414] dark:bg-white text-white dark:text-black shadow-gray-200 dark:shadow-none"
          )}
        >
          {saved ? "Configurações Salvas!" : <><Save className="w-6 h-6" /> Salvar Preferências</>}
        </motion.button>
      </form>

      {/* Danger Zone */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/20 mt-10 text-left"
      >
        <h3 className="text-sm font-bold text-red-900 dark:text-red-400 mb-4 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Zona de Perigo
        </h3>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onClearData();
          }}
          className="w-full py-4 bg-white dark:bg-dark-card text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
        >
          Limpar Todo o Histórico
        </button>
        <p className="text-[10px] text-red-400 mt-3 text-center font-medium">Esta ação não pode ser desfeita.</p>
      </motion.div>
    </div>
  );
}
