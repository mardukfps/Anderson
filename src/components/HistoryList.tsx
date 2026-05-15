import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OvertimeEntry, EntryType } from '../types';
import { formatCurrency, cn, formatExactHours, parseLocalDate } from '../lib/utils';
import { 
  Trash2, Edit3, Clock, CreditCard, Filter, X, Info, Search, TrendingUp
} from 'lucide-react';
import { 
  format
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryListProps {
  entries: OvertimeEntry[];
  onDelete: (id: string) => void;
  onEdit: (entry: OvertimeEntry) => void;
}

export default function HistoryList({ entries, onDelete, onEdit }: HistoryListProps) {
  const [filterType, setFilterType] = useState<EntryType | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesType = filterType === 'ALL' || entry.type === filterType;
      const matchesSearch = searchTerm === '' || 
        format(parseLocalDate(entry.date), "dd MMMM", { locale: ptBR }).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, filterType, searchTerm]);

  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: { monthName: string; entries: OvertimeEntry[]; totalHours: number; totalValue: number } } = {};
    
    filteredEntries.forEach(entry => {
      const date = parseLocalDate(entry.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMMM yyyy', { locale: ptBR });
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          entries: [],
          totalHours: 0,
          totalValue: 0
        };
      }
      
      groups[monthKey].entries.push(entry);
      groups[monthKey].totalHours += entry.calculatedHours;
      groups[monthKey].totalValue += entry.calculatedValue;
    });
    
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredEntries]);

  const clearFilters = () => {
    setFilterType('ALL');
    setSearchTerm('');
  };

  const hasActiveFilters = filterType !== 'ALL' || searchTerm !== '';

  if (entries.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center gap-4"
      >
        <div className="bg-app-card p-8 rounded-full mb-2 border border-app-border shadow-xl shadow-app-accent/5">
          <Clock className="w-12 h-12 text-app-muted opacity-30" />
        </div>
        <h3 className="text-xl font-bold text-app-text">Nenhum registro</h3>
        <p className="text-sm text-app-muted opacity-60 max-w-[200px]">Seu histórico aparecerá aqui assim que você adicionar registros.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Search & Filter Toggle */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted opacity-40" />
            <input 
              type="text"
              placeholder="Buscar por data ou nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-app-card border border-app-border rounded-2xl py-3 pl-11 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent/50 transition-all placeholder:opacity-30"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-3 rounded-2xl transition-all border shrink-0",
              showFilters || filterType !== 'ALL'
                ? "bg-app-accent text-app-accent-text border-app-accent shadow-lg shadow-app-accent/20" 
                : "bg-app-card text-app-muted border-app-border hover:bg-opacity-80"
            )}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-app-card rounded-2xl border border-app-border shadow-sm space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em]">Filtrar por Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['ALL', EntryType.PONTO, EntryType.CARTAO] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={cn(
                          "py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                          filterType === type 
                            ? "bg-app-accent text-app-accent-text border-app-accent" 
                            : "bg-app-bg text-app-muted border-app-border hover:bg-app-card"
                        )}
                      >
                        {type === 'ALL' ? (
                          'Todos'
                        ) : type === EntryType.PONTO ? (
                          <>
                            <Clock className="w-3 h-3" />
                            Ponto
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3" />
                            Cartão
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button 
                    onClick={clearFilters}
                    className="w-full py-3 flex items-center justify-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest hover:bg-red-500/5 rounded-xl transition-all border border-transparent hover:border-red-500/10"
                  >
                    <X className="w-3 h-3" />
                    Limpar Todos os Filtros
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-8">
        {groupedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
            <Search className="w-8 h-8 text-app-muted mb-4 opacity-20" />
            <p className="text-xs font-bold text-app-muted uppercase tracking-widest">Nenhum registro encontrado</p>
          </div>
        ) : (
          groupedEntries.map(([monthKey, group], groupIndex) => (
            <motion.div 
              key={monthKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="space-y-4"
            >
              {/* Month Header Section */}
              <div className="flex items-end justify-between px-2 pt-2 border-b border-app-border/40 pb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-app-accent uppercase tracking-[0.2em] mb-1">Período</span>
                  <h3 className="text-lg font-black text-app-text tracking-tighter">
                    {group.monthName}
                  </h3>
                </div>
                <div className="flex flex-col items-end text-right">
                  <span className="text-[9px] font-bold text-app-muted uppercase tracking-widest opacity-60 mb-0.5">Total Acumulado</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                      {group.totalValue > 0 ? formatCurrency(group.totalValue) : '---'}
                    </span>
                    <span className="text-xs font-bold text-app-muted bg-app-muted/5 px-2 py-0.5 rounded-lg">
                      {group.totalHours.toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Entries Grid/List */}
              <div className="grid grid-cols-1 gap-3">
                {group.entries.map((entry, index) => (
                  <motion.div 
                    key={entry.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                    className="group bg-app-card rounded-3xl border border-app-border overflow-hidden shadow-sm hover:shadow-md hover:border-app-accent/30 transition-all duration-300"
                  >
                    <div className="p-4 sm:p-7 flex items-start sm:items-center gap-4 sm:gap-6">
                      {/* Left: Date Circle */}
                      <div className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border transition-all duration-300 mt-1 sm:mt-0",
                        entry.type === EntryType.PONTO 
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/10 group-hover:bg-blue-500/20" 
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/10 group-hover:bg-emerald-500/20"
                      )}>
                        <span className="text-xs sm:text-sm font-black leading-none">{format(parseLocalDate(entry.date), 'dd')}</span>
                        <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-tighter mt-0.5 sm:mt-1">{format(parseLocalDate(entry.date), 'MMM', { locale: ptBR })}</span>
                      </div>
                      
                      {/* Center: Info */}
                      <div className="flex-1 min-w-0 py-0.5 sm:py-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-black text-app-text tracking-tight uppercase">
                            {format(parseLocalDate(entry.date), "EEEE", { locale: ptBR })}
                          </span>
                          <span className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded-full uppercase border flex items-center gap-1",
                            entry.type === EntryType.PONTO 
                              ? "bg-blue-500/5 text-blue-500 border-blue-500/20" 
                              : "bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
                          )}>
                            {entry.type === EntryType.PONTO ? (
                              <>
                                <Clock className="w-2.5 h-2.5" />
                                Ponto
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-2.5 h-2.5" />
                                Cartão
                              </>
                            )}
                          </span>
                          {entry.isNightShift && (
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase border bg-indigo-500/5 text-indigo-500 border-indigo-500/20">
                              Noturno
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] text-app-muted font-bold tracking-tight">
                          <div className="flex items-center gap-1.5 whitespace-nowrap bg-app-bg/50 px-2 py-1 rounded-lg border border-app-border/20">
                            <Clock className="w-3 h-3 opacity-40 shrink-0" />
                            <span className="tabular-nums">{entry.entryTime} <span className="opacity-30 mx-0.5">•</span> {entry.exitTime}</span>
                          </div>
                          <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg font-black transition-colors border",
                            entry.multiplier === 1.0 
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/10"
                              : "bg-purple-500/10 text-purple-500 border-purple-500/10"
                          )}>
                            <TrendingUp className="w-3 h-3 shrink-0" />
                            <span className="tabular-nums">{entry.multiplier === 1.0 ? '1x' : '100%'}</span>
                          </div>
                        </div>
                      </div>
 
                      {/* Right: Actions and Value */}
                      <div className="flex flex-col items-end justify-between self-stretch min-w-[80px] sm:min-w-[120px] gap-2 sm:gap-5">
                        <div className="text-right">
                          <div className="text-sm sm:text-xl font-black tracking-tighter text-app-text leading-none mb-1 whitespace-nowrap">
                            {formatCurrency(entry.calculatedValue)}
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-bold text-app-muted/60 uppercase tracking-widest tabular-nums">
                            {entry.calculatedHours.toFixed(2)}h total
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button 
                            onClick={() => onEdit(entry)}
                            className="p-2 sm:p-2.5 text-app-muted hover:text-app-accent hover:bg-app-accent/10 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5 sm:w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onDelete(entry.id)}
                            className="p-2 sm:p-2.5 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Notes Section if they exist */}
                    {entry.notes && (
                      <div className="px-5 pb-4 pt-0">
                        <div className="bg-app-bg/50 rounded-2xl p-3 border border-app-border/40 flex gap-3 items-start">
                          <Info className="w-3 h-3 text-app-accent mt-0.5 shrink-0 opacity-50" />
                          <p className="text-[10px] text-app-muted font-medium italic leading-relaxed">
                            "{entry.notes}"
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
