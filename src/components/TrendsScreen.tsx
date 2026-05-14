import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, LabelList 
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OvertimeEntry, EntryType, AppSettings } from '../types';
import { calculateSalarySummary } from '../lib/calculations';
import { TrendingUp, Clock, DollarSign, ArrowUpRight, Zap, PieChart as PieChartIcon, Info, Wallet, Receipt, ShieldCheck, ArrowRight } from 'lucide-react';
import { cn, formatCurrency, getBrazilDate, parseLocalDate } from '../lib/utils';
import AdBanner from './AdBanner';

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

    // Group entries by date for faster lookup
    const entriesByDate: Record<string, OvertimeEntry[]> = {};
    entries.forEach(e => {
      if (!entriesByDate[e.date]) entriesByDate[e.date] = [];
      entriesByDate[e.date].push(e);
    });

    // 1. Calculations
    const totalOvertime = entries.reduce((acc, e) => acc + e.calculatedHours, 0);
    const uniqueDates = new Set(entries.map(e => e.date)).size;
    const avgOvertime = uniqueDates > 0 ? totalOvertime / uniqueDates : 0;

    // 3. Earnings by Type
    let pontoValue = 0;
    let cartaoValue = 0;
    
    entries.forEach(e => {
      if (e.type === EntryType.PONTO) pontoValue += e.calculatedValue;
      else cartaoValue += e.calculatedValue;
    });

    const financialDistribution = [
      { name: 'Trabalho', value: pontoValue, color: '#3b82f6' },
      { name: 'Cartão', value: cartaoValue, color: '#10b981' }
    ].filter(d => d.value > 0);

    // 4. Financial Calculations for CURRENT MONTH
    const extraMonthValue = entries
      .filter(e => {
        const d = parseLocalDate(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && e.type === EntryType.PONTO;
      })
      .reduce((acc, e) => acc + e.calculatedValue, 0);

    const salarySummary = calculateSalarySummary(settings.baseSalary, extraMonthValue);

    // 4.1 Goals Calculation
    const dailyAverageValue = uniqueDates > 0 ? (pontoValue + cartaoValue) / uniqueDates : 0;
    const monthlyProjection = dailyAverageValue * 22; // Based on 22 working days

    const goals = [
      { name: 'Conservadora', value: monthlyProjection, percentage: 100, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { name: 'Foco Total', value: monthlyProjection * 1.25, percentage: 125, color: 'text-amber-500', bg: 'bg-amber-500/10' },
      { name: 'Meta de Ouro', value: monthlyProjection * 1.5, percentage: 150, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    ];

    const totalEarningAllTime = entries.reduce((acc, e) => acc + e.calculatedValue, 0);

    return { 
      financialDistribution, 
      totalEarningMonth: extraMonthValue,
      totalEarningAllTime,
      avgOvertime,
      baseSalary: settings.baseSalary,
      salarySummary,
      goals
    };
  }, [entries, settings]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
        <div className="bg-app-card w-24 h-24 rounded-full flex items-center justify-center border border-app-border shadow-inner">
          <TrendingUp className="w-10 h-10 text-app-muted opacity-20" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-app-text tracking-tight">Sem dados para análise</h3>
          <p className="text-sm text-app-muted max-w-[240px] leading-relaxed opacity-60">
            Seus gráficos aparecerão aqui assim que você registrar suas primeiras horas ou configurar seu salário em configurações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <header className="flex flex-col gap-1.5 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-app-accent/10 flex items-center justify-center text-app-accent">
            <TrendingUp className="w-5 h-5" />
          </div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black tracking-tighter text-app-text"
          >
            Insights
          </motion.h1>
        </div>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-app-muted text-[10px] font-black uppercase tracking-[0.3em] opacity-40 ml-1"
        >
          Análise Detalhada de Ganhos
        </motion.p>
      </header>

      {/* Main Analysis: Salary + Extra */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Net Income Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-12 xl:col-span-7 bg-app-card rounded-[3rem] p-8 border border-app-border shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Wallet className="w-48 h-48 text-app-accent" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-app-accent opacity-70" />
              <span className="text-[10px] font-black text-app-muted uppercase tracking-[0.3em]">Estimativa Líquida CLT</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
              <div>
                <h2 className="text-5xl sm:text-6xl font-black text-app-text tracking-tighter leading-none">
                  {formatCurrency(stats.salarySummary.netSalary)}
                </h2>
                <p className="text-xs font-bold text-app-muted opacity-60 mt-3 flex items-center gap-2">
                  Total após descontos obrigatórios (INSS/IRRF)
                </p>
              </div>
              
              <div className="flex flex-col items-start sm:items-end">
                <div className="text-[10px] font-black text-app-muted uppercase tracking-widest opacity-60 mb-1">Total Bruto</div>
                <div className="text-2xl font-black text-app-text tracking-tighter">{formatCurrency(stats.salarySummary.totalGross)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-app-bg/50 rounded-2xl p-5 border border-app-border/40 flex flex-col justify-between">
                <div>
                  <Receipt className="w-5 h-5 mb-2 text-blue-500 opacity-50" />
                  <p className="text-[9px] font-black text-app-muted uppercase tracking-widest opacity-60">Salário Base</p>
                </div>
                <p className="text-xl font-black text-app-text tracking-tight mt-1">{formatCurrency(stats.baseSalary)}</p>
              </div>
              
              <div className="bg-app-bg/50 rounded-2xl p-5 border border-app-border/40 flex flex-col justify-between">
                <div>
                  <Zap className="w-5 h-5 mb-2 text-emerald-500 opacity-50" />
                  <p className="text-[9px] font-black text-app-muted uppercase tracking-widest opacity-60">Extra Bruto</p>
                </div>
                <p className="text-xl font-black text-emerald-500 tracking-tight mt-1">+{formatCurrency(stats.totalEarningMonth)}</p>
              </div>

              <div className="bg-red-500/5 rounded-2xl p-5 border border-red-500/10 flex flex-col justify-between">
                <div>
                  <ArrowRight className="w-5 h-5 mb-2 text-red-500 opacity-50 rotate-45" />
                  <p className="text-[9px] font-black text-red-500/60 uppercase tracking-widest">Descontos</p>
                </div>
                <p className="text-xl font-black tracking-tight mt-1 text-red-500">-{formatCurrency(stats.salarySummary.totalDeductions)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Detailed Summary (Holerite) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-12 xl:col-span-5 bg-app-card rounded-[3rem] p-8 border border-app-border shadow-sm flex flex-col"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-app-accent/10 flex items-center justify-center text-app-accent">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-app-text uppercase tracking-widest">Resumo Estimado</h3>
              <p className="text-[9px] font-bold text-app-muted uppercase tracking-[0.2em]">Projection do Mês Atual</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-5">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[11px] font-bold text-app-text uppercase tracking-widest leading-none">Salário Base</span>
              </div>
              <span className="text-xs font-black text-app-text tabular-nums">{formatCurrency(stats.baseSalary)}</span>
            </div>
            
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-app-text uppercase tracking-widest leading-none">Total de Horas Extras</span>
              </div>
              <span className="text-xs font-black text-emerald-500 tabular-nums">+{formatCurrency(stats.totalEarningMonth)}</span>
            </div>
            
            <div className="h-px bg-app-border/40 my-2" />
            
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-[11px] font-bold text-app-muted uppercase tracking-widest leading-none">Dedução INSS</span>
              </div>
              <span className="text-xs font-black text-red-400/80 tabular-nums">-{formatCurrency(stats.salarySummary.inss)}</span>
            </div>
            
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[11px] font-bold text-app-muted uppercase tracking-widest leading-none">Dedução IRRF</span>
              </div>
              <span className="text-xs font-black text-red-500/80 tabular-nums">-{formatCurrency(stats.salarySummary.irrf)}</span>
            </div>

            <div className="h-px bg-app-border/40 my-2" />

            <div className="flex items-center justify-between py-2 px-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">FGTS (Depositado)</span>
              <span className="text-xs font-black text-emerald-600 tabular-nums">{formatCurrency(stats.salarySummary.fgts)}</span>
            </div>
          </div>
          
          <div className="mt-8 p-4 rounded-2xl bg-app-bg border border-app-border/50 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-app-accent/5 flex items-center justify-center text-app-accent flex-shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-app-muted leading-relaxed">
              O <span className="text-app-text font-black">Net Income</span> é o valor real que cai na sua conta. Ele varia conforme seu faturamento extra do mês.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Distribution Section */}
      <div className="flex justify-center">
        {/* Source Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl bg-app-card p-8 rounded-[3rem] border border-app-border shadow-sm flex flex-col items-center"
        >
          <div className="w-full flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-app-muted uppercase tracking-[0.2em]">Fontes de Renda</h3>
                <p className="text-[9px] font-bold text-app-muted/60 uppercase mt-0.5">Histórico Acumulado</p>
              </div>
            </div>
          </div>
          
          <div className="h-[220px] w-full relative pointer-events-none">
            {stats.financialDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.financialDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1500}
                    cornerRadius={12}
                  >
                    {stats.financialDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="outside" 
                      offset={15}
                      content={(props: any) => {
                        const { cx, cy, midAngle, outerRadius, name } = props;
                        if (typeof cx !== 'number' || typeof cy !== 'number' || typeof midAngle !== 'number' || typeof outerRadius !== 'number' || isNaN(cx) || isNaN(cy) || isNaN(midAngle) || isNaN(outerRadius)) {
                          return null;
                        }
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 20;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        
                        if (isNaN(x) || isNaN(y)) return null;

                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill="var(--app-text)" 
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central"
                            fontSize={8}
                            fontWeight={800}
                            className="opacity-40"
                          >
                            {name}
                          </text>
                        );
                      }}
                    />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-app-muted opacity-40 gap-2">
                <PieChartIcon className="w-8 h-8" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sem divisões...</p>
              </div>
            )}
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[8px] font-black text-app-muted uppercase tracking-[0.2em] mb-1">Bruto Extra</span>
              <span className="text-xl font-black text-app-text tracking-tighter">{formatCurrency(stats.totalEarningAllTime)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 w-full">
            {stats.financialDistribution.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1 px-4 py-4 rounded-[2rem] bg-app-bg/50 border border-app-border/30">
                <div className="flex items-center gap-1.5 mb-1 text-center">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[9px] font-black text-app-muted uppercase tracking-widest leading-none">{d.name}</span>
                </div>
                <span className="text-xs font-black text-app-text tabular-nums">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AdBanner />
    </div>
  );
}
