import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { OvertimeEntry, AppSettings, EntryType } from '../types';
import { formatCurrency, cn, formatExactHours } from '../lib/utils';
import { Wallet, Clock, TrendingUp, CircleCheck } from 'lucide-react';

interface DashboardProps {
  entries: OvertimeEntry[];
  settings: AppSettings;
  onNavigateToSettings?: () => void;
}

export default function Dashboard({ entries, settings, onNavigateToSettings }: DashboardProps) {
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
      progress: Math.min((totalHours / settings.monthlyLimit) * 100, 100),
    };
  }, [entries, settings]);

  return (
    <div className="space-y-7">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-extrabold tracking-tight text-app-text"
          >
            Resumo
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-app-muted text-[10px] font-heavy uppercase tracking-[0.25em]"
          >
            Jornada+ Monitor
          </motion.p>
        </div>
        <div className="bg-app-accent/5 px-4 py-2 rounded-2xl border border-app-border backdrop-blur-sm">
          <span className="text-[10px] font-black uppercase text-app-muted tracking-widest">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>
      </header>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-app-card text-app-text rounded-[3rem] p-8 shadow-2xl relative overflow-hidden transition-colors border border-app-border group"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-emerald-500/10 p-4 rounded-3xl backdrop-blur-md text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-7 h-7" />
            </div>
            <div className="text-right">
              <span className="text-app-muted text-[10px] font-black uppercase tracking-[0.15em] opacity-70">VALOR ESTIMADO</span>
              <div className="text-4xl font-black mt-1 tracking-tighter text-emerald-500 flex items-baseline gap-1 justify-end">
                <span className="text-lg opacity-60">R$</span>{formatCurrency(stats.totalValue).replace('R$', '').trim()}
              </div>
            </div>
          </div>
          
          {/* Values Breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-app-bg/50 backdrop-blur-sm p-4 rounded-3xl border border-app-border/40">
              <span className="text-app-muted text-[8px] font-black uppercase tracking-widest block mb-1.5 opacity-60">Ponto</span>
              <div className="text-base font-black text-app-text">{formatCurrency(stats.pontoValue)}</div>
            </div>
            <div className="bg-app-bg/50 backdrop-blur-sm p-4 rounded-3xl border border-app-border/40 text-right">
              <span className="text-app-muted text-[8px] font-black uppercase tracking-widest block mb-1.5 opacity-60">Cartão</span>
              <div className="text-base font-black text-app-text">{formatCurrency(stats.cartaoValue)}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-app-muted text-[9px] font-black uppercase tracking-widest block mb-1 opacity-70">Total acumulado</span>
                <div className="text-3xl font-black tracking-tighter text-app-text">{formatExactHours(stats.totalHours)}</div>
              </div>
              <div className="text-right">
                <span className="text-app-muted text-[9px] font-black uppercase tracking-widest block mb-1 opacity-70">Meta mensal</span>
                <div className="text-xs font-bold bg-app-accent/10 border border-app-accent/20 text-app-accent px-3 py-1 rounded-2xl backdrop-blur-sm">{settings.monthlyLimit}h/mês</div>
              </div>
            </div>
 
            <div className="relative group/progress">
              <div className="h-3 bg-app-bg border border-app-border/40 rounded-full overflow-hidden">
                <motion.div 
                  className={cn(
                    "h-full transition-all duration-1000 ease-out relative",
                    stats.progress >= 100 ? "bg-amber-500" : "bg-app-accent"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
              <div className="absolute -top-6 right-0 text-[10px] font-black text-app-accent opacity-0 group-hover/progress:opacity-100 transition-opacity">
                {stats.progress.toFixed(0)}%
              </div>
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
    </div>
  );
}

function StatCard({ icon, label, value, bgColor }: { icon: React.ReactNode, label: string, value: string, bgColor: string }) {
  return (
    <motion.div 
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="bg-app-card p-5 rounded-[2rem] border border-app-border flex flex-col gap-4 shadow-sm transition-all hover:shadow-xl hover:border-app-accent/20 group relative overflow-hidden"
    >
      <div className={cn(bgColor, "w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-black/5 dark:border-white/5")}>
        {icon}
      </div>
      <div>
        <span className="text-app-muted text-[10px] font-heavy uppercase tracking-widest opacity-60">{label}</span>
        <div className="text-2xl font-black tracking-tight text-app-text">{value}</div>
      </div>
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
    </motion.div>
  );
}
