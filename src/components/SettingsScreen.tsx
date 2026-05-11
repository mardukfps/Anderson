import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { AppSettings } from '../types';
import { 
  Settings as SettingsIcon, DollarSign, Target, Save, Clock, Trash2, 
  Palette, Moon, Sun, Monitor, LogOut, User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';

interface SettingsScreenProps {
  settings: AppSettings;
  user: User;
  onUpdate: (settings: AppSettings) => Promise<void>;
  onThemePreview: (theme: string) => void;
  onClearHistory: () => void;
  onLogout: () => Promise<void>;
}

export default function SettingsScreen({ 
  settings, 
  user, 
  onUpdate, 
  onThemePreview, 
  onClearHistory, 
  onLogout,
}: SettingsScreenProps) {
  const { resendVerification } = useAuth();
  const [baseHourlyRate, setBaseHourlyRate] = useState(settings.baseHourlyRate?.toString() || '0');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [baseSalary, setBaseSalary] = useState(settings.baseSalary?.toString() || '0');
  const [monthlyLimit, setMonthlyLimit] = useState(settings.monthlyLimit?.toString() || '40');
  const [defaultMultiplier, setDefaultMultiplier] = useState<1.0 | 2.0>(settings.defaultMultiplier || 1.0);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'temas'>('geral');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const themes = [
    { id: 'light', label: 'Claro', icon: Sun, color: '#F8F9FA' },
    { id: 'dark', label: 'Escuro', icon: Moon, color: '#0A0A0A' },
    { id: 'high-contrast', label: 'Contraste', icon: Monitor, color: '#000000' },
    { id: 'sky', label: 'Céu Noturno', icon: Palette, color: '#0F172A' },
    { id: 'ruby', label: 'Rubi', icon: Palette, color: '#1A0B0B' },
    { id: 'emerald', label: 'Esmeralda', icon: Palette, color: '#061A13' },
    { id: 'amber', label: 'Âmbar', icon: Palette, color: '#1C1206' },
  ];

  // Check if there are unsaved changes
  const hasChanges = (
    (Number(baseHourlyRate.toString().replace(',', '.')) || 0) !== (settings.baseHourlyRate || 0) ||
    (Number(baseSalary.toString().replace(',', '.')) || 0) !== (settings.baseSalary || 0) ||
    (Number(monthlyLimit.toString().replace(',', '.')) || 0) !== (settings.monthlyLimit || 0) ||
    defaultMultiplier !== (settings.defaultMultiplier || 1.0) ||
    theme !== (settings.theme || 'dark')
  );

  // Apply theme immediately for preview
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'high-contrast', 'sky', 'ruby', 'emerald', 'amber');
    root.classList.add(theme);
    
    if (theme !== settings.theme) {
      onThemePreview(theme);
    }
  }, [theme, settings.theme]);

  // Sync with prop if it changes (e.g. after initial fetch)
  React.useEffect(() => {
    setBaseHourlyRate(settings.baseHourlyRate?.toString() || '0');
    setBaseSalary(settings.baseSalary?.toString() || '0');
    setMonthlyLimit(settings.monthlyLimit?.toString() || '40');
    setDefaultMultiplier(settings.defaultMultiplier || 1.0);
    setTheme(settings.theme || 'dark');
  }, [settings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      const updatedSettings: AppSettings = {
        ...settings,
        baseHourlyRate: Number(baseHourlyRate.toString().replace(',', '.')) || 0,
        baseSalary: Number(baseSalary.toString().replace(',', '.')) || 0,
        monthlyLimit: Number(monthlyLimit.toString().replace(',', '.')) || 0,
        defaultMultiplier,
        theme: theme as any,
      };
      
      await onUpdate(updatedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      alert(`Erro ao salvar configurações: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId as any);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await resendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err: any) {
      alert(`Erro ao reenviar e-mail: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Profile Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-app-card p-6 rounded-3xl flex items-center gap-4 shadow-sm border border-app-border"
      >
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-app-bg flex items-center justify-center border border-app-border shadow-inner">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'Usuário'} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-8 h-8 text-app-muted" />
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <h2 className="font-black text-lg tracking-tight truncate text-app-text">
            {user.displayName || 'Usuário'}
          </h2>
          <p className="text-xs font-bold text-app-muted truncate uppercase tracking-widest opacity-60">
            {user.email}
          </p>
          {user.providerData.some(p => p.providerId === 'password') && (
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                user.emailVerified ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
              )}>
                {user.emailVerified ? 'E-mail Verificado' : 'E-mail Pendente'}
              </span>
              {!user.emailVerified && (
                <button 
                  onClick={handleResend}
                  disabled={resending || resent}
                  className="text-[8px] font-black uppercase tracking-widest text-app-accent hover:underline disabled:opacity-50"
                >
                  {resent ? 'Link Enviado!' : resending ? 'Enviando...' : 'Reenviar Link'}
                </button>
              )}
            </div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 group"
          title="Sair da conta"
        >
          <LogOut className={cn("w-5 h-5 transition-transform group-hover:translate-x-0.5", isLoggingOut && "animate-pulse")} />
        </motion.button>
      </motion.div>

      {/* Tabs */}
      <div className="flex p-1 bg-app-card rounded-2xl border border-app-border">
        <button
          onClick={() => setActiveTab('geral')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            activeTab === 'geral' 
              ? "bg-app-accent text-app-accent-text shadow-sm" 
              : "text-app-muted hover:bg-app-bg"
          )}
        >
          <SettingsIcon className="w-4 h-4" />
          Geral
        </button>
        <button
          onClick={() => setActiveTab('temas')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            activeTab === 'temas' 
              ? "bg-app-accent text-app-accent-text shadow-sm" 
              : "text-app-muted hover:bg-app-bg"
          )}
        >
          <Palette className="w-4 h-4" />
          Temas
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'geral' ? (
          <motion.div
            key="geral"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <form onSubmit={handleSave} className="space-y-6">
              <div className="bg-app-card p-6 rounded-3xl space-y-6 shadow-sm border border-app-border">
                <div className="flex justify-between items-center border-b border-app-border pb-2">
                  <h3 className="text-sm font-bold text-app-text">Finanças</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="w-3 h-3" /> Salário Base (R$)
                  </label>
                  <input 
                    type="text" 
                    value={baseSalary} 
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full bg-app-bg border border-app-border p-4 rounded-2xl focus:ring-2 focus:ring-app-accent/10 transition-all outline-none font-bold text-xl text-app-text"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Valor da Hora Base (R$)
                  </label>
                  <input 
                    type="text" 
                    value={baseHourlyRate} 
                    onChange={(e) => setBaseHourlyRate(e.target.value)}
                    className="w-full bg-app-bg border border-app-border p-4 rounded-2xl focus:ring-2 focus:ring-app-accent/10 transition-all outline-none font-bold text-xl text-app-text"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-3 h-3" /> Limite Mensal (Horas)
                  </label>
                  <input 
                    type="text" 
                    value={monthlyLimit} 
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    className="w-full bg-app-bg border border-app-border p-4 rounded-2xl focus:ring-2 focus:ring-app-accent/10 transition-all outline-none font-bold text-xl text-app-text"
                  />
                </div>
              </div>

              <div className="bg-app-card p-6 rounded-3xl space-y-4 shadow-sm border border-app-border">
                <div className="flex justify-between items-center border-b border-app-border pb-2 mb-2">
                  <h3 className="text-sm font-bold text-app-text">Dados</h3>
                </div>

                <button
                  type="button"
                  onClick={onClearHistory}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-red-500/5 border border-red-500/10 rounded-2xl hover:bg-red-500 text-red-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar Todo Histórico
                </button>
              </div>

              {(hasChanges || isSaving || saved) && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="submit"
                  disabled={isSaving}
                  className={cn(
                    "w-full py-5 rounded-2xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-3",
                    saved ? "bg-emerald-500 text-white" : "bg-app-accent text-app-accent-text"
                  )}
                >
                  {saved ? "Salvo!" : isSaving ? "Salvando..." : <><Save className="w-6 h-6" /> Salvar Preferências</>}
                </motion.button>
              )}
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="temas"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-app-card p-6 rounded-3xl shadow-sm border border-app-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-app-accent/10 text-app-accent">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-app-text">Personalização</h3>
                  <p className="text-[10px] text-app-muted font-bold uppercase tracking-widest">Escolha a aparência do app</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeSelect(t.id)}
                    className={cn(
                      "group relative flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                      theme === t.id 
                        ? "border-app-accent bg-app-accent/5 ring-1 ring-app-accent" 
                        : "border-app-border hover:border-app-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl border border-white/20 shadow-inner flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: t.color }}
                      >
                        <t.icon className={cn("w-5 h-5", theme === t.id ? "text-app-accent" : "text-app-muted")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-app-text">{t.label}</span>
                        </div>
                        <p className="text-[10px] font-bold text-app-muted opacity-60 uppercase tracking-widest">
                          Toque para aplicar
                        </p>
                      </div>
                    </div>
                    {theme === t.id && (
                      <ShieldCheck className="w-5 h-5 text-app-accent" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleSave()}
                disabled={!hasChanges || isSaving}
                className={cn(
                  "w-full mt-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  hasChanges 
                    ? "bg-app-accent text-app-accent-text" 
                    : "bg-app-muted/10 text-app-muted cursor-not-allowed"
                )}
              >
                {saved ? "Aplicado!" : "Aplicar Mudanças"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
