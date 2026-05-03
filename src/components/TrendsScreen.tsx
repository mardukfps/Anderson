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

    // 1. Last 7 Days Workload (Hours)
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    }).map(date => {
      const dayEntries = entries.filter(e => isSameDay(parseISO(e.date), date));
      const overtimeHours = dayEntries.reduce((acc, e) => acc + e.calculatedHours, 0);
      
      // If there are entries, we assume a full workday was completed + these overtime hours
      const normalHours = dayEntries.length > 0 ? (settings.dailyWorkload || 8) : 0;
      
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
    const avgOvertime = entries.length > 0 ? totalOvertime / new Set(entries.map(e => e.date)).size : 0;

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
    const firstOfMonth = startOfMonth(new Date());
    const monthlyData = eachDayOfInterval({
      start: firstOfMonth,
      end: new Date()
    }).map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEarnings = entries
        .filter(e => e.date === dateStr)
        .reduce((acc, e) => acc + e.calculatedValue, 0);

      return {
        date,
        formattedDate: format(date, 'dd/MM'),
        earnings: dayEarnings
      };
    });

    let cumulative = 0;
    const progressionData = monthlyData.map(d => {
      cumulative += d.earnings;
      return {
        date: d.formattedDate,
        value: parseFloat(cumulative.toFixed(2))
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
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="bg-app-card p-8 rounded-full mb-2 border border-app-border">
          <TrendingUp className="w-12 h-12 text-app-muted opacity-30" />
        </div>
        <h3 className="text-xl font-bold text-app-muted">Sem dados ainda</h3>
        <p className="text-sm text-app-muted opacity-60 max-w-[200px]">Adicione lançamentos para ver seus gráficos de tendência.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-app-text">Análise de Tendências</h2>
          <p className="text-app-muted text-sm">Visualize seu desempenho e ganhos</p>
        </div>
        <div className="bg-app-accent/10 p-3 rounded-2xl text-app-accent">
          <TrendingUp className="w-6 h-6" />
        </div>
      </header>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-app-card p-4 rounded-3xl border border-app-border"
        >
          <p className="text-[9px] font-black text-app-muted uppercase tracking-widest mb-1">Média Extra Diária</p>
          <p className="text-xl font-bold text-app-accent">{stats.avgOvertime.toFixed(1)}h</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-app-card p-4 rounded-3xl border border-app-border"
        >
          <p className="text-[9px] font-black text-app-muted uppercase tracking-widest mb-1">Total Mês (Ex)</p>
          <p className="text-xl font-bold text-emerald-500">{formatCurrency(stats.totalEarningMonth)}</p>
        </motion.div>
      </div>

      {/* Overview Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-app-card p-6 rounded-3xl border border-app-border shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-app-text">Progressão de Ganhos Extras</p>
          </div>
        </div>
        
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.progressionData} margin={{ top: 30, right: 35, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.5 }}
                dy={10}
                minTickGap={25}
              />
              <YAxis hide domain={['auto', 'auto']} padding={{ top: 40, bottom: 10 }} />
              <Tooltip 
                isAnimationActive={false}
                wrapperStyle={{ pointerEvents: 'none', outline: 'none' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 15, 20, 0.95)', 
                  border: '1px solid var(--app-border)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '8px' }}
                formatter={(value: number) => [formatCurrency(value), 'Ganho Acumulado']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                strokeWidth={4}
                animationDuration={1500}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Load */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-app-card p-6 rounded-3xl border border-app-border shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-app-text uppercase tracking-wider">Carga Semanal Total</h3>
            </div>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.last7Days} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.5 }}
                  dy={10}
                  interval={0}
                />
                <YAxis hide domain={[0, 'auto']} padding={{ top: 20 }} />
                <Tooltip 
                  isAnimationActive={false}
                  wrapperStyle={{ pointerEvents: 'none', outline: 'none' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 15, 20, 0.95)', 
                    border: '1px solid var(--app-border)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(12px)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '11px', padding: '2px 0' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-app-card/95 border border-app-border p-3 rounded-2xl shadow-xl backdrop-blur-md">
                          <p className="text-[10px] font-black text-app-muted uppercase tracking-widest mb-2">Dia: {label}</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-bold text-gray-400">NORMAL</span>
                              <span className="text-xs font-mono font-bold text-app-text">{data.normal}h</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-bold text-app-accent">EXTRA</span>
                              <span className="text-xs font-mono font-bold text-app-accent">+{data.overtime}h</span>
                            </div>
                            <div className="h-px bg-app-border my-1" />
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-black text-white">TOTAL</span>
                              <span className="text-xs font-mono font-black text-white">{data.total}h</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="normal" 
                  stackId="a" 
                  fill="rgba(148, 163, 184, 0.15)" 
                  radius={[0, 0, 0, 0]} 
                  barSize={16} 
                />
                <Bar 
                  dataKey="overtime" 
                  stackId="a" 
                  fill="var(--app-accent)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={16} 
                >
                  <LabelList 
                    dataKey="total" 
                    position="top" 
                    offset={10}
                    content={({ x, y, value }: any) => (
                      <text 
                        x={x + 8} 
                        y={y - 12} 
                        fill="currentColor" 
                        fontSize={10} 
                        fontWeight="900" 
                        textAnchor="middle" 
                        className="fill-app-text"
                      >
                        {value}h
                      </text>
                    )}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400/20" />
              <span className="text-[8px] font-black text-app-muted uppercase tracking-widest">Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-app-accent" />
              <span className="text-[8px] font-black text-app-muted uppercase tracking-widest">Extra</span>
            </div>
          </div>
        </motion.div>

        {/* Distribution */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-app-card p-6 rounded-3xl border border-app-border shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-app-text uppercase tracking-wider">Distribuição Financeira</h3>
          </div>
          
          <div className="h-[200px] w-full flex items-center justify-center">
            {stats.financialDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.financialDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1000}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.financialDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    isAnimationActive={false}
                    wrapperStyle={{ pointerEvents: 'none', outline: 'none' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(20, 20, 25, 0.95)', 
                      border: '1px solid var(--app-border)',
                      borderRadius: '16px',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                    }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-app-muted text-xs text-center opacity-40">Sem dados específicos</div>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
            {stats.financialDistribution.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
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
