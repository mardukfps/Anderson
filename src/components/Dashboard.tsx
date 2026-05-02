import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { OvertimeEntry, AppSettings, EntryType } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Wallet, Clock, TrendingUp, CircleCheck } from 'lucide-react';

interface DashboardProps {
  entries: OvertimeEntry[];
  settings: AppSettings;
}

export default function Dashboard({ entries, settings }: DashboardProps) {
  const stats = useMemo(() => {
    const totalHours = entries.reduce((acc, curr) => acc + curr.calculatedHours, 0);
    const totalValue = entries.reduce((acc, curr) => acc + curr.calculatedValue, 0);
    
    const pontoEntries = entries.filter(e => e.type === EntryType.PONTO);
    const cartaoEntries = entries.filter(e => e.type === EntryType.CARTAO);

    const pontoHours = pontoEntries.reduce((acc, curr) => acc + curr.calculatedHours, 0);
    const pontoValue = pontoEntries.reduce((acc, curr) => acc + curr.calculatedValue, 0);
    
    const cartaoHours = cartaoEntries.reduce((acc, curr) => acc + curr.calculatedHours, 0);
    const cartaoValue = cartaoEntries.reduce((acc, curr) => acc + curr.calculatedValue, 0);

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
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Painel GERAL
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 text-sm font-medium uppercase tracking-widest text-[10px]"
        >
          BEM-VINDO AO JORNADA+
        </motion.p>
      </header>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#141414] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Saldo TOTAL Acumulado</span>
              <div className="text-3xl font-bold mt-1 tracking-tight">
                {formatCurrency(stats.totalValue)}
              </div>
            </div>
          </div>
          
          {/* Values Breakdown */}
          <div className="grid grid-cols-2 gap-4 mb-6 border-b border-white/10 pb-6">
            <div>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-0.5">Saldo do Ponto</span>
              <div className="text-lg font-bold">{formatCurrency(stats.pontoValue)}</div>
            </div>
            <div className="text-right">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-0.5">Saldo do Cartão</span>
              <div className="text-lg font-bold">{formatCurrency(stats.cartaoValue)}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-white/60 text-xs font-bold uppercase tracking-widest block mb-1">Total de Horas</span>
                <div className="text-2xl font-mono font-medium">{stats.totalHours.toFixed(1)}h</div>
              </div>
              <div className="text-right">
                <span className="text-white/60 text-xs font-bold uppercase tracking-widest block mb-1">Meta Mensal</span>
                <div className="text-sm font-semibold">{settings.monthlyLimit}h</div>
              </div>
            </div>

            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white transition-all duration-1000 ease-out" 
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard 
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            label="Ponto Eletrônico"
            value={`${stats.pontoHours.toFixed(1)}h`}
            bgColor="bg-blue-50"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <StatCard 
            icon={<CircleCheck className="w-5 h-5 text-emerald-500" />}
            label="Cartão de Ponto"
            value={`${stats.cartaoHours.toFixed(1)}h`}
            bgColor="bg-emerald-50"
          />
        </motion.div>
      </div>

      {/* Configuration Alert */}
      {settings.baseHourlyRate === 0 && (
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-3xl flex gap-3 items-center">
          <Wallet className="w-6 h-6 text-blue-500" />
          <div className="flex-1">
            <div className="text-xs font-bold text-blue-900 uppercase">Configuração Pendente</div>
            <p className="text-[10px] text-blue-600 font-medium">Defina o valor da sua hora base nos Ajustes para calcular o saldo financeiro.</p>
          </div>
          <motion.div 
            animate={{ x: [0, 5, 0] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-blue-500"
          >
            →
          </motion.div>
        </div>
      )}

      {/* Info Alert */}
      {stats.totalHours >= settings.monthlyLimit && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 items-start animate-pulse">
          <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-amber-900 uppercase tracking-tight">Limite Atingido</div>
            <p className="text-xs text-amber-700 font-medium">Você ultrapassou sua meta mensal de {settings.monthlyLimit} horas.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bgColor }: { icon: React.ReactNode, label: string, value: string, bgColor: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className={cn(bgColor, "w-10 h-10 rounded-xl flex items-center justify-center")}>
        {icon}
      </div>
      <div>
        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{label}</span>
        <div className="text-xl font-bold tracking-tight">{value}</div>
      </div>
    </div>
  );
}
