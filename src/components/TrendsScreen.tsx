import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, LabelList 
} from 'recharts';
import { format, subDays, startOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OvertimeEntry, EntryType, AppSettings } from '../types';
import { calculateEntryPerformance, calculateINSS } from '../lib/calculations';
import { TrendingUp, Clock, Wallet, Calendar, DollarSign } from 'lucide-react';
import { cn, formatCurrency, getBrazilDate } from '../lib/utils';

interface TrendsScreenProps {
  entries: OvertimeEntry[];
  settings: AppSettings;
}

export default function TrendsScreen({ entries, settings }: TrendsScreenProps) {
  const stats = useMemo(() => {
    if (entries.length === 0 && settings.baseSalary <= 0) return null;

    const brazilToday = parseISO(getBrazilDate());
    const currentMonth = brazilToday.getMonth();
    const currentYear = brazilToday.getFullYear();

    // Group entries by date for faster lookup
    const entriesByDate: Record<string, OvertimeEntry[]> = {};
    entries.forEach(e => {
      if (!entriesByDate[e.date]) entriesByDate[e.date] = [];
      entriesByDate[e.date].push(e);
    });

    // 1. Average Daily Overtime
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
      { name: 'Ponto', value: pontoValue, color: '#3b82f6' },
      { name: 'Cartão', value: cartaoValue, color: '#10b981' }
    ].filter(d => d.value > 0);

    // 4. Financial Calculations
    const inss = calculateINSS(settings.baseSalary);
    const netBaseSalary = settings.baseSalary - inss;
    const totalExtraMonth = entries
      .filter(e => {
        const d = parseISO(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && e.type === EntryType.PONTO;
      })
      .reduce((acc, e) => acc + e.calculatedValue, 0);

    const totalIncomeMonth = netBaseSalary + totalExtraMonth;

    // 5. Full History Progression (Cumulative Earnings)
    const sortedDates = Object.keys(entriesByDate).sort();
    
    let historyCharts: any[] = [];
    if (sortedDates.length > 0) {
      const firstDate = parseISO(sortedDates[0]);
      const lastDate = parseISO(sortedDates[sortedDates.length - 1]);
      
      const historyData = eachDayOfInterval({
        start: firstDate,
        end: lastDate
      }).map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayEntries = entriesByDate[dateStr] || [];
        const dayEarnings = dayEntries.reduce((acc, e) => acc + e.calculatedValue, 0);
        const dayHours = dayEntries.reduce((acc, e) => acc + e.calculatedHours, 0);

        return {
          date,
          formattedDate: format(date, 'dd/MM'),
          earnings: dayEarnings,
          hours: dayHours
        };
      });

      let cumulative = 0;
      historyCharts = historyData.map(d => {
        cumulative += d.earnings;
        return {
          date: d.formattedDate,
          day: d.formattedDate,
          value: parseFloat(cumulative.toFixed(2)),
          dailyEarnings: parseFloat(d.earnings.toFixed(2)),
          dailyHours: parseFloat(d.hours.toFixed(1))
        };
      });
    }

    const totalEarningAllTime = entries.reduce((acc, e) => acc + e.calculatedValue, 0);

    return { 
      financialDistribution, 
      progressionData: historyCharts, 
      totalEarningMonth: totalExtraMonth,
      totalEarningAllTime,
      avgOvertime,
      baseSalary: settings.baseSalary,
      inss,
      netBaseSalary,
      totalIncomeMonth
    };
  }, [entries, settings]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
        <div className="bg-app-card w-24 h-24 rounded-full flex items-center justify-center border border-app-border shadow-inner">
          <TrendingUp className="w-10 h-10 text-app-muted opacity-20" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-app-text">Sem dados para análise</h3>
          <p className="text-sm text-app-muted max-w-[240px] leading-relaxed">Seus gráficos aparecerão aqui assim que você registrar suas primeiras horas extras ou configurar seu salário.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-1">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold tracking-tight text-app-text"
        >
          Tendências
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 text-sm font-medium uppercase tracking-[0.2em] text-[10px]"
        >
          ANÁLISE DE DESEMPENHO E GANHOS
        </motion.p>
      </header>

      {/* Salary Summary Card */}
      {stats.baseSalary > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-app-card p-6 rounded-[2.5rem] border border-app-border shadow-sm overflow-hidden relative group"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-app-accent/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-app-accent/10 transition-colors" />
          
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-app-accent/10 flex items-center justify-center text-app-accent">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-app-muted uppercase tracking-[0.2em]">Resumo Financeiro Mensal</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-app-muted">
                <span className="uppercase tracking-widest">Salário Base</span>
                <span className="text-app-text">{formatCurrency(stats.baseSalary)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-rose-500/80">
                <span className="uppercase tracking-widest">Desconto INSS</span>
                <span>- {formatCurrency(stats.inss)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-emerald-500/80 pt-2 border-t border-app-border/30">
                <span className="uppercase tracking-widest">Salário Líquido</span>
                <span>{formatCurrency(stats.netBaseSalary)}</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-app-bg/50 border border-app-border/50 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em] mb-1">Total Previsto (Este Mês)</p>
              <p className="text-3xl font-black text-app-accent tracking-tighter">
                {formatCurrency(stats.totalIncomeMonth)}
              </p>
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Incluindo HE {formatCurrency(stats.totalEarningMonth)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Overview Stats Line */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-app-card p-5 rounded-[2rem] border border-app-border shadow-sm flex flex-col gap-1"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Média Diária</p>
          </div>
          <p className="text-2xl font-bold text-app-text tracking-tight">{stats.avgOvertime.toFixed(1)}h</p>
          <p className="text-[9px] text-app-muted font-medium">HORAS EXTRAS / DIA</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-app-card p-5 rounded-[2rem] border border-app-border shadow-sm flex flex-col gap-1"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Ganhos Totais</p>
          </div>
          <p className="text-2xl font-bold text-emerald-500 tracking-tight">{formatCurrency(stats.totalEarningAllTime)}</p>
          <p className="text-[9px] text-app-muted font-medium">SALDO ACUMULADO TOTAL</p>
        </motion.div>
      </div>

      {/* Progression & Daily Earnings Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-app-card p-0 rounded-[2.5rem] border border-app-border shadow-sm overflow-hidden"
      >
        <div className="p-7 pb-0">
          <h3 className="text-lg font-bold text-app-text tracking-tight uppercase tracking-[0.1em] text-[12px] opacity-40">Desempenho de Ganhos</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-emerald-500">{formatCurrency(stats.totalEarningAllTime)}</span>
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Histórico Completo</span>
          </div>
        </div>
        
        <div className="h-[300px] w-full mt-4 flex min-w-0 pointer-events-none select-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.progressionData} margin={{ top: 25, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="rgba(148, 163, 184, 0.05)" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(148, 163, 184, 0.4)', fontSize: 7, fontWeight: 700 }}
                interval={Math.max(0, Math.floor(stats.progressionData.length / 8))}
                dy={10}
              />
              <Bar 
                dataKey="dailyEarnings" 
                fill="var(--app-accent)" 
                radius={[4, 4, 0, 0]}
              >
                <LabelList 
                  dataKey="dailyEarnings" 
                  position="top" 
                  content={({ x, y, value, width, index }: any) => {
                    const data = stats.progressionData[index];
                    if (!data || data.dailyEarnings === 0) return null;
                    // Only show labels if there's enough space or if it's the last few entries
                    if (stats.progressionData.length > 15 && index % Math.floor(stats.progressionData.length / 5) !== 0 && index !== stats.progressionData.length - 1) return null;
                    
                    return (
                      <g>
                        <text 
                          x={(x as number) + (width as number) / 2} 
                          y={(y as number) - 15} 
                          fill="var(--app-text)" 
                          fontSize={8} 
                          fontWeight="900" 
                          textAnchor="middle"
                        >
                          {data.dailyHours}h
                        </text>
                        <text 
                          x={(x as number) + (width as number) / 2} 
                          y={(y as number) - 5} 
                          fill="#10b981" 
                          fontSize={7} 
                          fontWeight="700" 
                          textAnchor="middle"
                        >
                          {formatCurrency(data.dailyEarnings)}
                        </text>
                      </g>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Two Column Grid for specialized charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Financial Distribution Donut Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-app-card p-7 rounded-[2.5rem] border border-app-border shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-app-text tracking-tight">Fontes de Ganhos</h3>
              <p className="text-xs text-app-muted font-medium leading-tight">Distribuição por tipo de registro</p>
            </div>
          </div>
          
          <div className="h-[260px] w-full flex items-center justify-center relative pointer-events-none select-none">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 40, bottom: 40, left: 40, right: 40 }}>
                <Pie
                  data={stats.financialDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1200}
                  cornerRadius={10}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 15;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const data = stats.financialDistribution[index];

                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill={data.color} 
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        fontSize={8}
                        fontWeight="bold"
                      >
                        {formatCurrency(value)}
                      </text>
                    );
                  }}
                >
                  {stats.financialDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Donut Hole Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[8px] font-black text-app-muted uppercase tracking-[0.2em] mb-1">Total Geral</span>
              <span className="text-lg font-black text-app-text">{formatCurrency(stats.totalEarningAllTime)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4">
            {stats.financialDistribution.map((d, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider">{d.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
