import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  getDay,
  isToday,
  subMonths,
  subDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import { OvertimeEntry, AppSettings, EntryType } from '../types';
import { formatCurrency, cn, formatExactHours, getBrazilDate, parseLocalDate } from '../lib/utils';
import { Wallet, Clock, CircleCheck, AlertCircle, Mail, TrendingUp, Plus, Calendar as CalendarIcon } from 'lucide-react';
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

  const dashboardData = useMemo(() => {
    const todayStr = getBrazilDate();
    const brazilToday = parseLocalDate(todayStr);
    
    // Stats calculation
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

    // Calendar logic
    const monthStart = startOfMonth(brazilToday);
    const monthEnd = endOfMonth(brazilToday);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Fill prefix days (days from previous month to complete the first week)
    const prefixDaysCount = getDay(monthStart);
    const prefixDays = Array.from({ length: prefixDaysCount }).map((_, i) => {
      const date = subDays(monthStart, prefixDaysCount - i);
      return {
        key: `prefix-${i}`,
        date,
        dayNum: date.getDate(),
        hours: 0,
        hasData: false,
        empty: true,
        isToday: false
      };
    });

    const calendarDays = daysInMonth.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entries.filter(e => e.date === dateStr);
      const dayHours = dayEntries.reduce((acc, e) => acc + e.calculatedHours, 0);
      
      return {
        key: dateStr,
        date,
        dayNum: date.getDate(),
        hours: dayHours,
        hasData: dayHours > 0,
        empty: false,
        isToday: dateStr === todayStr
      };
    });

    return {
      stats: {
        totalHours,
        totalValue,
        pontoHours,
        pontoValue,
        cartaoHours,
        cartaoValue,
        progress: Math.min((totalHours / settings.monthlyLimit) * 100, 100)
      },
      calendar: {
        currentMonth: format(brazilToday, 'MMMM yyyy', { locale: ptBR }),
        days: [...prefixDays, ...calendarDays]
      }
    };
  }, [entries, settings]);

  const { stats, calendar } = dashboardData;

  const getHeatmapColor = (hours: number) => {
    if (hours === 0) return 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/50';
    if (hours <= 1.5) return 'bg-sky-500 dark:bg-sky-600 border-sky-600/20 shadow-sm text-white';
    if (hours <= 3.5) return 'bg-emerald-500 dark:bg-emerald-600 border-emerald-600/20 shadow-sm text-white';
    if (hours <= 5.5) return 'bg-amber-500 dark:bg-amber-600 border-amber-600/20 shadow-sm text-white';
    if (hours <= 8.5) return 'bg-orange-600 dark:bg-orange-700 border-orange-700/20 shadow-sm text-white';
    if (hours <= 12) return 'bg-rose-600 dark:bg-rose-700 border-rose-700/20 shadow-sm text-white';
    return 'bg-violet-700 dark:bg-violet-800 border-violet-800/20 shadow-md text-white';
  };

  return (
    <div className="space-y-8 pb-4">
      {/* Header Section */}
      <header className="flex items-center justify-between px-2">
        <div className="space-y-0.5">
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-bold text-app-accent uppercase tracking-[0.2em]"
          >
            Olá, {user?.displayName?.split(' ')[0] || 'Usuário'}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black tracking-tight text-app-text flex items-center gap-2"
          >
            Seu Jornada<span className="text-app-accent">+</span>
          </motion.h1>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-12 h-12 bg-app-card rounded-2xl border border-app-border flex items-center justify-center shadow-sm relative overflow-hidden"
        >
          <Logo size={32} />
          <div className="absolute inset-0 bg-app-accent/5" />
        </motion.div>
      </header>

      {/* Hero Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-app-card rounded-[2rem] p-8 border border-app-border shadow-sm relative overflow-hidden group mx-1"
      >
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em]">Saldo Disponível</span>
              <h2 className="text-4xl font-black text-app-text tracking-tighter">
                {formatCurrency(stats.totalValue)}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-app-bg/30 p-4 rounded-2xl border border-app-border/40">
              <p className="text-[9px] font-bold text-app-muted uppercase mb-1">Ponto</p>
              <p className="text-base font-black text-app-text">{formatCurrency(stats.pontoValue)}</p>
            </div>
            <div className="bg-app-bg/30 p-4 rounded-2xl border border-app-border/40">
              <p className="text-[9px] font-bold text-app-muted uppercase mb-1 text-right">Cartão</p>
              <p className="text-base font-black text-app-text text-right">{formatCurrency(stats.cartaoValue)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress & Goals Grid */}
      <div className="grid grid-cols-2 gap-4 px-1">
        {/* Total Hours Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-app-card rounded-[2rem] p-6 border border-app-border shadow-sm flex flex-col justify-between h-44"
        >
          <div className="space-y-1">
            <p className="text-[9px] font-black text-app-accent uppercase tracking-widest">Horas Extras</p>
            <p className="text-2xl font-black text-app-text tracking-tighter">
              {formatExactHours(stats.totalHours)}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-app-muted">{stats.progress.toFixed(0)}% da meta</span>
              <span className="text-app-accent">{settings.monthlyLimit}h</span>
            </div>
            <div className="h-1.5 bg-app-bg rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                className={cn(
                  "h-full rounded-full transition-colors",
                  stats.progress >= 100 ? "bg-amber-500" : "bg-app-accent"
                )}
              />
            </div>
          </div>
        </motion.div>

        {/* Small Breakdown Sidebar */}
        <div className="flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 bg-blue-500/5 rounded-[1.5rem] p-5 border border-blue-500/10 flex flex-col justify-center"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Ponto</span>
              <Clock className="w-3.5 h-3.5 text-blue-500/50" />
            </div>
            <p className="text-xl font-black text-app-text tracking-tight">{formatExactHours(stats.pontoHours)}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 bg-emerald-500/5 rounded-[1.5rem] p-5 border border-emerald-500/10 flex flex-col justify-center"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Cartão</span>
              <CircleCheck className="w-3.5 h-3.5 text-emerald-500/50" />
            </div>
            <p className="text-xl font-black text-app-text tracking-tight">{formatExactHours(stats.cartaoHours)}</p>
          </motion.div>
        </div>
      </div>

      {/* Activity Calendar Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-1"
      >
        <div className="bg-app-card rounded-[2rem] p-6 border border-app-border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-app-accent uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5" />
                Mapa de Frequência
              </h3>
              <p className="text-[10px] font-bold text-app-text capitalize opacity-60">{calendar.currentMonth}</p>
            </div>
            <div className="flex items-center gap-1">
              {[0, 1, 3, 6, 9].map(h => (
                <div 
                  key={h} 
                  className={cn(
                    "w-2.5 h-2.5 rounded-sm border border-black/5 dark:border-white/5 shadow-inner",
                    getHeatmapColor(h)
                  )} 
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
              <div key={i} className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 text-center pb-1 uppercase tracking-tighter">
                {day}
              </div>
            ))}
            {calendar.days.map((day) => (
              <motion.div
                key={day.key}
                whileTap={!day.empty ? { scale: 0.9 } : {}}
                className={cn(
                  "aspect-square rounded-lg border flex flex-col items-center justify-center relative transition-all duration-500",
                  day.empty 
                    ? "bg-transparent text-app-muted/20 border-transparent" 
                    : cn(
                        getHeatmapColor(day.hours),
                        day.isToday && "ring-2 ring-app-accent ring-offset-2 ring-offset-app-card border-app-accent z-10 scale-105"
                      )
                )}
              >
                <span className={cn(
                  "text-[10px] font-black tracking-tight",
                  day.hasData
                    ? "text-white" 
                    : day.empty 
                      ? "text-zinc-300 dark:text-zinc-800" 
                      : "text-zinc-900 dark:text-zinc-100"
                )}>
                  {day.dayNum}
                </span>
                {day.hours > 0 && !day.empty && (
                  <span className={cn(
                    "text-[7px] font-bold leading-none mt-0.5 whitespace-nowrap text-white"
                  )}>
                    {day.hours % 1 === 0 ? day.hours.toFixed(0) : day.hours.toFixed(1)}h
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Alerts Section (Contextual) */}
      <div className="space-y-3">
        {user && !user.emailVerified && user.providerData.some(p => p.providerId === 'password') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-[2rem] flex gap-4 items-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">E-mail Pendente</p>
              <p className="text-[11px] text-app-muted font-bold truncate">Verifique sua conta para segurança.</p>
            </div>
            <button 
              onClick={handleResend}
              disabled={resending || resent}
              className={cn(
                "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                resent ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500 text-white shadow-lg shadow-amber-500/20 active:scale-95"
              )}
            >
              {resent ? 'Enviado' : 'Validar'}
            </button>
          </motion.div>
        )}

        {settings.baseHourlyRate === 0 && (
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onNavigateToSettings}
            className="w-full text-left bg-app-card border border-app-border p-5 rounded-[2rem] flex gap-4 items-center hover:border-app-accent/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-app-accent/5 flex items-center justify-center text-app-accent group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-app-accent uppercase tracking-widest">Configuração Necessária</p>
              <p className="text-[11px] text-app-muted font-bold">Defina o valor da sua hora no menu Ajustes.</p>
            </div>
            <Plus className="w-4 h-4 text-app-accent" />
          </motion.button>
        )}

        {stats.totalHours >= settings.monthlyLimit && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-app-accent/5 border border-app-accent/10 p-5 rounded-[2rem] flex gap-4 items-center"
          >
            <div className="w-10 h-10 rounded-2xl bg-app-accent/10 flex items-center justify-center text-app-accent">
              <CircleCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-app-accent uppercase tracking-widest">Alvo Alcançado</p>
              <p className="text-[11px] text-app-muted font-bold">Você atingiu sua meta mensal de {settings.monthlyLimit} horas extras.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

