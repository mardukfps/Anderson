import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { AppSettings } from '../types';
import { 
  Settings as SettingsIcon, DollarSign, Target, Save, Clock, Trash2, 
  Palette, Moon, Sun, Monitor, LogOut, User as UserIcon,
  Cloud, Heart, Leaf, Flame,
  ShieldCheck, EyeOff, Eye, Camera, Edit3, Percent, Settings2,
  Lock, Key, Shield, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  User, updatePassword, reauthenticateWithCredential, 
  EmailAuthProvider, sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import ProfileModal from './ProfileModal';

interface SettingsScreenProps {
  settings: AppSettings;
  user: User;
  onUpdate: (settings: AppSettings) => Promise<void>;
  onThemePreview: (theme: string) => void;
  onClearHistory: () => void;
  onLogout: () => Promise<void>;
  onSaveSuccess?: () => void;
}

export default function SettingsScreen({ 
  settings, 
  user, 
  onUpdate, 
  onThemePreview, 
  onClearHistory, 
  onLogout,
  onSaveSuccess,
}: SettingsScreenProps) {
  const { profile, resendVerification } = useAuth();
  const [baseHourlyRate, setBaseHourlyRate] = useState(settings.baseHourlyRate?.toString() || '0');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [baseSalary, setBaseSalary] = useState(settings.baseSalary?.toString() || '0');
  const [monthlyLimit, setMonthlyLimit] = useState(settings.monthlyLimit?.toString() || '40');
  const [defaultMultiplier, setDefaultMultiplier] = useState<number>(settings.defaultMultiplier || 1.0);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'temas'>('geral');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  const handleProfileSuccess = (message: string) => {
    setGlobalMessage(message);
    setTimeout(() => setGlobalMessage(null), 4000);
  };

  const themes = [
    { id: 'light', label: 'Claro', icon: Sun, color: '#F59E0B' },
    { id: 'dark', label: 'Escuro', icon: Moon, color: '#818CF8' },
    { id: 'high-contrast', label: 'Contraste', icon: Monitor, color: '#FFFFFF' },
    { id: 'sky', label: 'Céu Noturno', icon: Cloud, color: '#38BDF8' },
    { id: 'ruby', label: 'Rubi', icon: Heart, color: '#F87171' },
    { id: 'emerald', label: 'Esmeralda', icon: Leaf, color: '#34D399' },
    { id: 'amber', label: 'Âmbar', icon: Flame, color: '#FBBF24' },
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
      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess();
        }, 800);
      } else {
        setTimeout(() => setSaved(false), 3000);
      }
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
    <div className="space-y-6 pb-12 text-left relative min-h-screen">
      {/* Absolute Header Actions (Top Right) */}
      <div className="absolute top-0 right-0 flex gap-2 z-20">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsProfileOpen(true)}
            className="p-3.5 rounded-2xl bg-app-card border border-app-border text-app-accent hover:bg-app-accent hover:text-white transition-all shadow-lg group"
            title="Configurações de Perfil"
          >
            <Settings2 className="w-5 h-5 transition-transform group-hover:rotate-45" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-3.5 rounded-2xl bg-app-card border border-app-border text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg group"
            title="Sair da conta"
          >
            <LogOut className={cn("w-5 h-5 transition-transform group-hover:translate-x-0.5", isLoggingOut && "animate-pulse")} />
          </motion.button>
      </div>

      <AnimatePresence>
        {globalMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs px-4"
          >
            <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border-2 border-white/20">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider leading-tight">{globalMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-10" /> {/* Spacer for the top right buttons now that title is gone */}

      {/* Tabs */}
      <div className="flex p-1 bg-app-card rounded-2xl border border-app-border">
        <button
          onClick={() => setActiveTab('geral')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            activeTab === 'geral' 
              ? "bg-app-accent text-app-accent-text shadow-sm" 
              : "text-app-muted hover:bg-app-bg"
          )}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          Geral
        </button>
        <button
          onClick={() => setActiveTab('temas')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            activeTab === 'temas' 
              ? "bg-app-accent text-app-accent-text shadow-sm" 
              : "text-app-muted hover:bg-app-bg"
          )}
        >
          <Palette className="w-3.5 h-3.5" />
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
            className="space-y-6"
          >
            {/* Profile Section */}
            <div 
              onClick={() => setIsProfileOpen(true)}
              className="bg-app-card p-6 rounded-[2rem] flex items-center gap-5 shadow-sm border border-app-border overflow-hidden relative group cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-app-bg flex items-center justify-center border border-app-border shadow-inner transition-transform group-hover:scale-105">
                  {profile?.photoURL || user.photoURL ? (
                    <img src={profile?.photoURL || user.photoURL} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-app-muted/20" />
                  )}
                </div>
                {!user.emailVerified && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-app-card" />
                )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                <h2 className="font-black text-xl tracking-tight truncate text-app-text">
                  {profile?.name || user.displayName || 'Usuário'}
                </h2>
                <p className="text-xs font-bold text-app-muted truncate uppercase tracking-widest opacity-60">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                    user.emailVerified 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  )}>
                    {user.emailVerified ? 'CONTA VERIFICADA' : 'AGUARDANDO VERIFICAÇÃO'}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="bg-app-card p-6 rounded-3xl space-y-6 shadow-sm border border-app-border">
                <div className="flex justify-between items-center border-b border-app-border pb-2">
                  <h3 className="text-sm font-bold text-app-text flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Finanças
                  </h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
                    Salário Base (R$)
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
                    Valor da Hora Base (R$)
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
                    Limite Mensal (Horas)
                  </label>
                  <input 
                    type="text" 
                    value={monthlyLimit} 
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    className="w-full bg-app-bg border border-app-border p-4 rounded-2xl focus:ring-2 focus:ring-app-accent/10 transition-all outline-none font-bold text-xl text-app-text"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
                    Multiplicador Padrão
                  </label>
                  <div className="flex bg-app-bg p-1 rounded-2xl border border-app-border">
                    <button
                      type="button"
                      onClick={() => setDefaultMultiplier(1.0)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                        defaultMultiplier === 1.0 
                          ? "bg-app-accent text-app-accent-text shadow-sm" 
                          : "text-app-muted hover:text-app-text"
                      )}
                    >
                      1.0x
                    </button>
                    <button
                      type="button"
                      onClick={() => setDefaultMultiplier(2.0)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                        defaultMultiplier === 2.0 
                          ? "bg-app-accent text-app-accent-text shadow-sm" 
                          : "text-app-muted hover:text-app-text"
                      )}
                    >
                      2.0x
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-app-card p-6 rounded-3xl space-y-4 shadow-sm border border-app-border">
                <div className="flex justify-between items-center border-b border-app-border pb-2 mb-2">
                  <h3 className="text-sm font-bold text-app-text">Dados & Segurança</h3>
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
                  {saved ? "Configurações Salvas!" : isSaving ? "Salvando..." : <><Save className="w-6 h-6" /> Salvar Preferências</>}
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
            className="space-y-6"
          >
            <div className="bg-app-card p-6 rounded-3xl shadow-sm border border-app-border space-y-6">
              <div className="flex items-center gap-3 mb-2 border-b border-app-border pb-2">
                <div className="p-2 rounded-xl bg-app-accent/10 text-app-accent">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-app-text">Personalização</h3>
                  <p className="text-[10px] text-app-muted font-bold uppercase tracking-widest">Temas do Sistema</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
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
                        className="w-12 h-12 rounded-xl border border-white/10 shadow-inner flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: `${t.color}15` }}
                      >
                        <t.icon 
                          className="w-5 h-5 transition-colors" 
                          style={{ color: t.color }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-app-text">{t.label}</span>
                          <div 
                            className="w-3 h-3 rounded-full border border-app-border shadow-sm" 
                            style={{ backgroundColor: t.color }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-app-muted opacity-60 uppercase tracking-widest">
                          Toque para visualizar
                        </p>
                      </div>
                    </div>
                    {theme === t.id && (
                      <ShieldCheck className="w-5 h-5 text-app-accent" />
                    )}
                  </button>
                ))}
              </div>

              {(hasChanges || isSaving || saved) && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={cn(
                    "w-full py-5 rounded-2xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 mt-4",
                    saved ? "bg-emerald-500 text-white" : "bg-app-accent text-app-accent-text"
                  )}
                >
                  {saved ? "Tema Aplicado!" : isSaving ? "Aplicando..." : "Confirmar Alterações de Tema"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onUpdateSuccess={handleProfileSuccess}
        user={user} 
      />
    </div>
  );
}
