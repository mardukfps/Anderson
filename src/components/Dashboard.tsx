import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { OvertimeEntry, AppSettings, EntryType } from '../types';
import { formatCurrency, cn } from '../lib/utils';
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
    <div className="space-y-6 pt-2">
      <header className="flex flex-col gap-1 px-1">
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-app-muted text-[11px] font-black uppercase tracking-[0.2em]"
        >
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-black tracking-tight text-app-text"
        >
          Meus Ganhos
        </motion.h1>
      </header>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        className="bg-app-card text-app-text rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-app-border"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div className="bg-app-accent text-white p-4 rounded-3xl shadow-xl shadow-app-accent/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="text-app-muted text-[10px] font-black uppercase tracking-widest block mb-1">TOTAL ACUMULADO</span>
              <div className="text-4xl font-black tracking-tight text-app-text">
                {formatCurrency(stats.totalValue)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-blue-500/[0.03] p-4 rounded-3xl border border-blue-500/10">
              <span className="text-blue-500/60 text-[9px] font-black uppercase tracking-widest block mb-1">Ponto</span>
              <div className="text-xl font-black text-app-text">{formatCurrency(stats.pontoValue)}</div>
            </div>
            <div className="bg-emerald-500/[0.03] p-4 rounded-3xl border border-emerald-500/10">
              <span className="text-emerald-500/60 text-[9px] font-black uppercase tracking-widest block mb-1">Cartão</span>
              <div className="text-xl font-black text-app-text">{formatCurrency(stats.cartaoValue)}</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-app-muted text-[10px] font-black uppercase tracking-widest block mb-1">Horas Extras</span>
                <div className="text-4xl font-black tracking-tight text-app-text">
                  {stats.totalHours.toFixed(1)}
                  <span className="text-lg font-bold text-app-muted ml-1 lowercase">hrs</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-app-muted text-[10px] font-black uppercase tracking-widest block mb-2">Meta {settings.monthlyLimit}h</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="w-2.5 h-2.5 rounded-full bg-app-accent" />
                  <span className="text-sm font-black text-app-text">{Math.round(stats.progress)}%</span>
                </div>
              </div>
            </div>

            <div className="h-4 bg-app-bg rounded-full overflow-hidden p-1 shadow-inner border border-app-border">
              <motion.div 
                className={cn(
                  "h-full rounded-full transition-all shadow-sm",
                  stats.progress >= 100 ? "bg-amber-500" : "bg-app-accent"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>
        
        {/* Background Gradients */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-app-accent opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500 opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={<Clock className="w-5 h-5 text-blue-500" />}
          label="Ponto"
          value={`${stats.pontoHours.toFixed(1)}h`}
          bgColor="bg-blue-500/10"
        />
        <StatCard 
          icon={<CircleCheck className="w-5 h-5 text-emerald-500" />}
          label="Cartão"
          value={`${stats.cartaoHours.toFixed(1)}h`}
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
