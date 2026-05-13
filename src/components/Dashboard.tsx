import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { OvertimeEntry, AppSettings, EntryType } from '../types';
import { formatCurrency, cn, formatExactHours } from '../lib/utils';
import { Wallet, Clock, CircleCheck, AlertCircle, Mail, TrendingUp, Plus } from 'lucide-react';
import AdBanner from './AdBanner';
import Logo from './Logo';

interface DashboardProps {
  entries: OvertimeEntry[];
  settings: AppSettings;
  onNavigateToSettings?: () => void;
}

export default function Dashboard({ entries, settings, onNavigateToSettings }: DashboardProps) {
  const { user, resendVerification } = useAuth();
  const [resending, setResending] = React.useState(false);
  const [resent, setResent] = React.useState(false);

  const handleResend = async () => {
    try {
      setResending(true);
      await resendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setResending(false);
    }
  };

  const stats = useMemo(() => {
    let totalHours = 0;
    let totalValue = 0;
    let pontoHours = 0;
    let pontoValue = 0;
    let cartaoHours = 0;
    let cartaoValue = 0;

    for (const e of entries) {
      totalHours += e.calculatedHours;
      totalValue += e.calculatedValue;
      
      if (e.type === EntryType.PONTO) {
        pontoHours += e.calculatedHours;
        pontoValue += e.calculatedValue;
      } else {
        cartaoHours += e.calculatedHours;
        cartaoValue += e.calculatedValue;
      }
    }

    return {
      totalHours,
      totalValue,
      pontoHours,
      pontoValue,
      cartaoHours,
      cartaoValue,
      progress: Math.min((totalHours / settings.monthlyLimit) * 100, 100)
    };
  }, [entries, settings]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold tracking-tight text-app-text"
          >
            Painel GERAL
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-app-muted text-[10px] font-black uppercase tracking-[0.3em] opacity-60"
          >
            BEM-VINDO AO JORNADA<span className="text-app-accent">+</span>
          </motion.p>
        </div>
        <Logo size={40} />
      </header>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-app-card text-app-text rounded-[2.5rem] p-7 shadow-xl relative overflow-hidden transition-colors border border-app-border"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="bg-app-accent/10 p-4 rounded-2xl backdrop-blur-sm text-app-accent">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="text-app-muted text-[10px] font-black uppercase tracking-[0.1em]">SALDO ACUMULADO</span>
              <div className="text-3xl font-black mt-1 tracking-tight text-emerald-500">
                {formatCurrency(stats.totalValue)}
              </div>
            </div>
          </div>
          
          {/* Values Breakdown */}
          <div className="grid grid-cols-2 gap-4 mb-8 border-b border-app-border/30 pb-8">
            <div className="bg-app-card/40 p-3 rounded-2xl border border-app-border/50">
              <span className="text-app-muted text-[9px] font-black uppercase tracking-widest block mb-1">Saldo do Ponto</span>
              <div className="text-lg font-black text-app-text">{formatCurrency(stats.pontoValue)}</div>
            </div>
            <div className="bg-app-card/40 p-3 rounded-2xl border border-app-border/50 text-right">
              <span className="text-app-muted text-[9px] font-black uppercase tracking-widest block mb-1 text-right">Saldo do Cartão</span>
              <div className="text-lg font-black text-app-text">{formatCurrency(stats.cartaoValue)}</div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-app-muted text-[10px] font-black uppercase tracking-widest block mb-1">Total de Horas Extras</span>
                <div className="text-3xl font-black tracking-tight text-app-text">{formatExactHours(stats.totalHours)}</div>
              </div>
              <div className="text-right">
                <span className="text-app-muted text-[10px] font-black uppercase tracking-widest block mb-1">Meta Mensal</span>
                <div className="text-sm font-bold bg-app-accent/10 text-app-accent px-3 py-1 rounded-full">{settings.monthlyLimit}h</div>
              </div>
            </div>

            <div className="h-2.5 bg-app-accent/5 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                className={cn(
                  "h-full transition-all duration-1000 ease-out",
                  stats.progress >= 100 ? "bg-amber-500" : "bg-app-accent"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-app-accent/10 rounded-full blur-3xl opacity-30" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl opacity-30" />
      </motion.div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={<Clock className="w-5 h-5 text-blue-500" />}
          label="Ponto"
          value={formatExactHours(stats.pontoHours)}
          bgColor="bg-blue-500/10"
        />
        <StatCard 
          icon={<CircleCheck className="w-5 h-5 text-emerald-500" />}
          label="Cartão"
          value={formatExactHours(stats.cartaoHours)}
          bgColor="bg-emerald-500/10"
        />
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        {user && !user.emailVerified && user.providerData.some(p => p.providerId === 'password') && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl flex gap-4 items-center">
            <div className="bg-amber-500/20 p-2.5 rounded-xl">
              <Mail className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">E-mail Não Verificado</div>
              <p className="text-[11px] text-app-muted font-bold leading-relaxed">Verifique seu e-mail para garantir a segurança da sua conta.</p>
            </div>
            <button 
              onClick={handleResend}
              disabled={resending || resent}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                resent ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500 text-white hover:bg-amber-600"
              )}
            >
              {resent ? 'Enviado!' : resending ? 'Enviando...' : 'Reenviar'}
            </button>
          </div>
        )}

        {settings.baseHourlyRate === 0 && (
          <button 
            onClick={onNavigateToSettings}
            className="w-full text-left bg-blue-500/5 border border-blue-500/10 p-5 rounded-3xl flex gap-4 items-center hover:bg-blue-500/10 transition-all cursor-pointer group"
          >
            <div className="bg-blue-500/20 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Configuração Pendente</div>
              <p className="text-[11px] text-app-muted font-bold leading-relaxed">Defina sua hora base para ativar cálculos financeiros.</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-500 rotate-90" />
          </button>
        )}

        {stats.totalHours >= settings.monthlyLimit && (
          <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-3xl flex gap-4 items-start animate-fade-in ring-1 ring-amber-500/10">
            <div className="bg-amber-500/20 p-2.5 rounded-xl">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Meta Atingida</div>
              <p className="text-[11px] text-app-muted font-bold leading-relaxed">Você já ultrapassou sua meta planejada de {settings.monthlyLimit}h.</p>
            </div>
          </div>
        )}
      </div>
      
      <AdBanner />
    </div>
  );
}

function StatCard({ icon, label, value, bgColor }: { icon: React.ReactNode, label: string, value: string, bgColor: string }) {
  return (
    <motion.div 
      whileHover={{ y: -3 }}
      className="bg-app-card p-4 rounded-[1.5rem] border border-app-border flex flex-col gap-3 transition-all hover:shadow-md hover:border-app-accent/20 group"
    >
      <div className={cn(bgColor, "w-10 h-10 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm")}>
        {icon}
      </div>
      <div>
        <span className="text-app-muted text-[9px] font-black uppercase tracking-wider">{label}</span>
        <div className="text-xl font-black tracking-tight text-app-text">{value}</div>
      </div>
    </motion.div>
  );
}

