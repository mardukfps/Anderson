import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AppSettings } from '../types';
import { Settings as SettingsIcon, DollarSign, Target, Percent, Save, Bell, Clock, Trash2, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { notificationService } from '../services/notificationService';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onClearData: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function SettingsScreen({ settings, onUpdate, onClearData, isDarkMode, onToggleDarkMode }: SettingsScreenProps) {
  const [baseHourlyRate, setBaseHourlyRate] = useState(settings.baseHourlyRate?.toString() || '0');
  const [monthlyLimit, setMonthlyLimit] = useState(settings.monthlyLimit?.toString() || '40');
  const [defaultPercentage, setDefaultPercentage] = useState<0.5 | 1.0>(settings.defaultPercentage || 0.5);
  const [notificationsEnabled, setNotificationsEnabled] = useState(!!settings.notificationsEnabled);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || '18:00');
  const [saved, setSaved] = useState(false);

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await notificationService.requestPermission();
      if (!granted) {
        alert('As notificações do sistema estão bloqueadas. Para ativá-las, abra o app em uma Nova Aba e permita o acesso nas configurações do navegador.\n\nEnquanto isso, o app usará notificações internas.');
        // Still allow toggling on to show internal toasts
      }
    }
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      baseHourlyRate: parseFloat(baseHourlyRate) || 0,
      monthlyLimit: parseInt(monthlyLimit) || 0,
      defaultPercentage,
      notificationsEnabled,
      reminderTime,
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
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
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

        {/* Notifications Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-dark-card p-6 rounded-3xl space-y-6 shadow-sm border border-gray-100 dark:border-white/5"
        >
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notificações</h3>
            <button 
              type="button"
              onClick={handleToggleNotifications}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out",
                notificationsEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-white/10"
              )}
            >
              <div className={cn(
                "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out shadow-sm",
                notificationsEnabled ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>

          <div className={cn("space-y-4 transition-opacity", !notificationsEnabled && "opacity-40 pointer-events-none")}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" /> Horário do Lembrete Diário
              </label>
              <input 
                type="time" 
                value={reminderTime} 
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent p-4 rounded-2xl focus:ring-2 focus:ring-[#141414]/10 dark:focus:ring-white/10 transition-all outline-none font-bold text-xl font-mono dark:text-white"
              />
            </div>
            
            <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <Bell className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-1" />
              <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                Alertas inteligentes de 80% e 100% da meta mensal estão ativos por padrão ao habilitar notificações.
              </p>
            </div>

            <button
              type="button"
              onClick={() => notificationService.testNotification()}
              className="w-full py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              Testar Notificação agora
            </button>
          </div>
          
          {notificationsEnabled && (
            <p className="text-[9px] text-gray-400 text-center italic">
              Dica: Se as notificações não aparecerem, tente abrir o app em uma <span className="font-bold underline">Nova Aba</span>.
            </p>
          )}
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
