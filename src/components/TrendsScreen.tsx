import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { OvertimeEntry, EntryType, AppSettings } from '../types';
import { calculateSalarySummary } from '../lib/calculations';
import { 
  TrendingUp, ShieldCheck, PieChart as PieChartIcon, 
  Wallet
} from 'lucide-react';
import { formatCurrency, getBrazilDate, parseLocalDate } from '../lib/utils';

interface TrendsScreenProps {
  entries: OvertimeEntry[];
  settings: AppSettings;
}

export default function TrendsScreen({ entries, settings }: TrendsScreenProps) {
  const stats = useMemo(() => {
    if (entries.length === 0 && settings.baseSalary <= 0) return null;

    const brazilToday = parseLocalDate(getBrazilDate());
    const currentMonth = brazilToday.getMonth();
    const currentYear = brazilToday.getFullYear();

    // Total Earnings by Type
    const pontoValue = entries
      .filter(e => e.type === EntryType.PONTO)
      .reduce((acc, e) => acc + e.calculatedValue, 0);
    const cartaoValue = entries
      .filter(e => e.type === EntryType.CARTAO)
      .reduce((acc, e) => acc + e.calculatedValue, 0);

    const financialDistribution = [
      { name: 'Horas', value: pontoValue, color: 'var(--app-accent)' },
      { name: 'Cartão', value: cartaoValue, color: '#10b981' }
    ].filter(d => d.value > 0);

    // Current Month Extra
    const entriesThisMonth = entries.filter(e => {
      const d = parseLocalDate(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const extraMonthPontoValue = entriesThisMonth
      .filter(e => e.type === EntryType.PONTO)
      .reduce((acc, e) => acc + e.calculatedValue, 0);

    const extraMonthCartaoValue = entriesThisMonth
      .filter(e => e.type === EntryType.CARTAO)
      .reduce((acc, e) => acc + e.calculatedValue, 0);

    const totalEarningAllTime = entries.reduce((acc, e) => acc + e.calculatedValue, 0);
    const salarySummary = calculateSalarySummary(settings.baseSalary, extraMonthPontoValue);

    return { 
      financialDistribution, 
      totalExtraPonto: extraMonthPontoValue,
      totalExtraCartao: extraMonthCartaoValue,
      totalEarningAllTime,
      baseSalary: settings.baseSalary,
      salarySummary
    };
  }, [entries, settings]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center opacity-60">
        <TrendingUp className="w-12 h-12 mb-4 opacity-10" />
        <p className="text-sm font-medium tracking-tight">Sem dados estatísticos ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32">
      <header className="px-2">
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-black text-app-accent uppercase tracking-widest mb-1"
        >
          Resumo Financeiro
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-black text-app-text tracking-tighter"
        >
          Estatísticas
        </motion.h1>
      </header>

      <section className="px-2 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-[10px] font-black text-app-muted uppercase tracking-[0.2em] opacity-60">
            <ShieldCheck className="w-4 h-4 text-app-accent" />
            Líquido Mensal Estimado
          </div>
          <div className="text-6xl font-black text-app-text tracking-tighter tabular-nums">
            {formatCurrency(stats.salarySummary.netSalary)}
          </div>
          <p className="text-[11px] font-bold text-app-muted opacity-40 uppercase tracking-wider">
            Considerando salário base + horas (ponto)
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-3xl bg-app-card/20 border border-app-border/40"
          >
            <p className="text-[10px] font-black text-app-muted uppercase tracking-widest mb-1">Base</p>
            <p className="text-xl font-black text-app-text tabular-nums text-sm sm:text-base">{formatCurrency(stats.baseSalary)}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10"
          >
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Extras (Ponto)</p>
            <p className="text-xl font-black text-emerald-600 tabular-nums text-sm sm:text-base">+{formatCurrency(stats.totalExtraPonto)}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-3xl bg-red-500/5 border border-red-500/10 shadow-sm"
          >
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Deduções</p>
            <div className="space-y-0.5">
              <p className="text-xl font-black text-red-600 tabular-nums text-sm sm:text-base">-{formatCurrency(stats.salarySummary.totalDeductions)}</p>
              <div className="flex flex-col text-[8px] font-bold text-red-400 uppercase leading-tight">
                <span>INSS: {formatCurrency(stats.salarySummary.inss)}</span>
                <span>IRRF: {formatCurrency(stats.salarySummary.irrf)}</span>
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="p-5 rounded-3xl bg-app-accent/5 border border-app-accent/10"
          >
            <p className="text-[10px] font-black text-app-accent uppercase tracking-widest mb-1">Extra (Cartão)</p>
            <p className="text-xl font-black text-app-accent tabular-nums text-sm sm:text-base">+{formatCurrency(stats.totalExtraCartao)}</p>
          </motion.div>
        </div>
      </section>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-2"
      >
        <div className="p-8 rounded-[2.5rem] bg-app-card/20 border border-app-border/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-app-text uppercase tracking-widest">Origem dos Ganhos</h3>
              <p className="text-[9px] font-black text-app-muted uppercase opacity-40">Todo o período</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-app-muted opacity-30" />
          </div>
          
          <div className="h-52 w-full flex items-center justify-center relative">
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.financialDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={8}
                    animationDuration={1500}
                  >
                    {stats.financialDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-black text-app-muted uppercase opacity-40">Acumulado</span>
                <span className="text-xl font-black text-app-text tracking-tighter tabular-nums">
                  {formatCurrency(stats.totalEarningAllTime)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-8 justify-center">
            {stats.financialDistribution.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] font-black text-app-muted uppercase tracking-widest">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="px-2"
      >
        <div className="p-6 rounded-3xl bg-app-accent/5 border border-app-accent/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-app-accent/10 flex items-center justify-center text-app-accent">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-app-accent uppercase tracking-widest">Saldo FGTS</p>
              <p className="text-sm font-black text-app-text opacity-60">Provisionamento do mês</p>
            </div>
          </div>
          <p className="text-xl font-black text-app-accent tabular-nums">
            {formatCurrency(stats.salarySummary.fgts)}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
