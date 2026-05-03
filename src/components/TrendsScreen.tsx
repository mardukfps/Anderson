import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, LabelList 
} from 'recharts';
import { format, subDays, startOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OvertimeEntry, EntryType, AppSettings } from '../types';
import { calculateEntryPerformance } from '../lib/calculations';
import { TrendingUp, Clock, Wallet, Calendar } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

interface TrendsScreenProps {
  entries: OvertimeEntry[];
  settings: AppSettings;
}

export default function TrendsScreen({ entries, settings }: TrendsScreenProps) {
  const stats = useMemo(() => {
    if (entries.length === 0) return null;

    // Group entries by date for faster lookup
    const entriesByDate: Record<string, OvertimeEntry[]> = {};
    entries.forEach(e => {
      if (!entriesByDate[e.date]) entriesByDate[e.date] = [];
      entriesByDate[e.date].push(e);
    });

    // 1. Last 7 Days Workload (Hours)
    const today = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    }).map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entriesByDate[dateStr] || [];
      const overtimeHours = dayEntries.reduce((acc, e) => acc + e.calculatedHours, 0);
      
      // If there are entries, we assume a full workday was completed + these overtime hours
      const normalHours = dayEntries.length > 0 ? 8.0 : 0;
      
      return {
        name: format(date, 'eee', { locale: ptBR }),
        fullDate: format(date, 'dd/MM'),
        normal: parseFloat(normalHours.toFixed(1)),
        overtime: parseFloat(overtimeHours.toFixed(1)),
        total: parseFloat((normalHours + overtimeHours).toFixed(1))
      };
    });

    // 2. Average Daily Overtime
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

    // 4. Monthly Progression (Cumulative Earnings)
    const firstOfMonth = startOfMonth(today);
    const monthlyData = eachDayOfInterval({
      start: firstOfMonth,
      end: today
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
    const progressionData = monthlyData.map(d => {
      cumulative += d.earnings;
      return {
        date: d.formattedDate,
        day: format(d.date, 'eee', { locale: ptBR }),
        value: parseFloat(cumulative.toFixed(2)),
        dailyEarnings: parseFloat(d.earnings.toFixed(2)),
        dailyHours: parseFloat(d.hours.toFixed(1))
      };
    });

    const totalEarningMonth = monthlyData.reduce((acc, d) => acc + d.earnings, 0);

    return { 
      last7Days, 
      financialDistribution, 
      progressionData, 
      totalEarningMonth,
      avgOvertime
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
          <p className="text-sm text-app-muted max-w-[240px] leading-relaxed">Seus gráficos aparecerão aqui assim que você registrar suas primeiras horas extras.</p>
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
            <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Ganhos no Mês</p>
          </div>
          <p className="text-2xl font-bold text-emerald-500 tracking-tight">{formatCurrency(stats.totalEarningMonth)}</p>
          <p className="text-[9px] text-app-muted font-medium">SALDO ACUMULADO</p>
        </motion.div>
      </div>

      {/* Progression & Daily Earnings Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-app-card p-0 rounded-[2.5rem] border border-app-border shadow-sm overflow-hidden"
      >
        <div className="p-7 pb-0">
          <h3 className="text-lg font-bold text-app-text tracking-tight uppercase tracking-[0.1em] text-[12px] opacity-40">Desempenho Diário e Ganhos</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-emerald-500">{formatCurrency(stats.totalEarningMonth)}</span>
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Total no Mês</span>
          </div>
        </div>
        
        <div className="h-[300px] w-full mt-4 pointer-events-none select-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.progressionData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="rgba(148, 163, 184, 0.05)" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(148, 163, 184, 0.4)', fontSize: 9, fontWeight: 700 }}
                interval={Math.floor(stats.progressionData.length / 7)}
                dy={10}
              />
              <Bar 
                dataKey="dailyEarnings" 
                fill="var(--app-accent)" 
                radius={[6, 6, 0, 0]}
                barSize={20}
              >
                <LabelList 
                  dataKey="dailyHours" 
                  position="top" 
                  content={({ x, y, value, width, index }: any) => {
                    const data = stats.progressionData[index];
                    if (!data || data.dailyEarnings === 0) return null;
                    return (
                      <g>
                        <text 
                          x={(x as number) + (width as number) / 2} 
                          y={(y as number) - 15} 
                          fill="var(--app-text)" 
                          fontSize={9} 
                          fontWeight="900" 
                          textAnchor="middle"
                        >
                          {value}h
                        </text>
                        <text 
                          x={(x as number) + (width as number) / 2} 
                          y={(y as number) - 5} 
                          fill="#10b981" 
                          fontSize={8} 
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
        {/* Weekly Workload Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-app-card p-7 rounded-[2.5rem] border border-app-border shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-app-text tracking-tight">Carga Semanal</h3>
              <p className="text-xs text-app-muted font-medium">Equilíbrio entre horas normais e extras</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-app-muted opacity-30" />
                  <span className="text-[9px] font-bold text-app-muted uppercase">Normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
                  <span className="text-[9px] font-bold text-app-muted uppercase">Extra</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-[220px] w-full pointer-events-none select-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.last7Days} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={0}>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(148, 163, 184, 0.5)', fontSize: 10, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis hide domain={[0, 'auto']} padding={{ top: 20 }} />
                <Bar 
                  dataKey="normal" 
                  stackId="a" 
                  fill="rgba(148, 163, 184, 0.1)" 
                  radius={[0, 0, 0, 0]} 
                  barSize={24} 
                />
                <Bar 
                  dataKey="overtime" 
                  stackId="a" 
                  fill="#fbbf24" 
                  radius={[8, 8, 4, 4]} 
                  barSize={24} 
                  animationDuration={1500}
                >
                  <LabelList 
                    dataKey="overtime" 
                    position="top" 
                    offset={10}
                    content={({ x, y, value }: any) => {
                      if (!value || value === 0) return null;
                      return (
                        <text 
                          x={(x as number) + 12} 
                          y={(y as number) - 10} 
                          fill="#fbbf24" 
                          fontSize={10} 
                          fontWeight="900" 
                          textAnchor="middle"
                        >
                          +{value}h
                        </text>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

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
          
          <div className="h-[220px] w-full flex items-center justify-center relative pointer-events-none select-none">
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
                  animationDuration={1200}
                  cornerRadius={10}
                >
                  {stats.financialDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Donut Hole Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-black text-app-muted uppercase tracking-[0.2em] mb-1">Total Mês</span>
              <span className="text-xl font-black text-app-text">{formatCurrency(stats.totalEarningMonth)}</span>
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
