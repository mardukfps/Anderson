import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OvertimeEntry, EntryType } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Trash2, Edit3, Clock, CreditCard, Filter, X, 
  Calendar as CalendarIcon, LayoutList, Calendar,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  format, parseISO, isWithinInterval, startOfDay, endOfDay, isSameDay,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  subMonths, addMonths, isSameMonth
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CalendarInput from './CalendarInput';

interface HistoryListProps {
  entries: OvertimeEntry[];
  onDelete: (id: string) => void;
  onEdit: (entry: OvertimeEntry) => void;
}

export default function HistoryList({ entries, onDelete, onEdit }: HistoryListProps) {
  const [filterType, setFilterType] = useState<EntryType | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesType = filterType === 'ALL' || entry.type === filterType;
      
      let matchesDate = true;
      if (startDate && entry.date < startDate) matchesDate = false;
      if (endDate && entry.date > endDate) matchesDate = false;

      return matchesType && matchesDate;
    });
  }, [entries, filterType, startDate, endDate]);

  const handleCalendarDayClick = (dateStr: string) => {
    setStartDate(dateStr);
    setEndDate(dateStr);
    setViewMode('list');
    setShowFilters(true);
  };

  const clearFilters = () => {
    setFilterType('ALL');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = filterType !== 'ALL' || startDate !== '' || endDate !== '';

  if (entries.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center gap-4"
      >
        <div className="bg-app-card p-8 rounded-full mb-2 border border-app-border">
          <Clock className="w-12 h-12 text-app-muted opacity-30" />
        </div>
        <h3 className="text-xl font-bold text-app-muted">Nenhum registro ainda</h3>
        <p className="text-sm text-app-muted opacity-60 max-w-[200px]">Comece adicionando suas horas extras no botão central.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* View Mode Toggle */}
      <div className="flex bg-app-card p-1 rounded-2xl border border-app-border mb-4">
        <button
          onClick={() => setViewMode('list')}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            viewMode === 'list' ? "bg-app-accent text-app-accent-text shadow-sm" : "text-app-muted hover:bg-app-bg"
          )}
        >
          <LayoutList className="w-4 h-4" />
          Lista
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            viewMode === 'calendar' ? "bg-app-accent text-app-accent-text shadow-sm" : "text-app-muted hover:bg-app-bg"
          )}
        >
          <CalendarIcon className="w-4 h-4" />
          Calendário
        </button>
      </div>

      {/* Search & Filter Header (Only for list view) */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">
              Exibindo {filteredEntries.length} de {entries.length} registros
            </p>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                showFilters || hasActiveFilters 
                  ? "bg-app-accent text-app-accent-text" 
                  : "bg-app-card text-app-muted hover:bg-opacity-80 border border-app-border"
              )}
            >
              <Filter className="w-3 h-3" />
              Filtros
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
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
                <div className="p-4 bg-app-card rounded-2xl border border-app-border shadow-sm space-y-4 mt-1">
                  {/* Type Filter */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest">Tipo de Lançamento</label>
                    <div className="flex gap-2">
                      {(['ALL', EntryType.PONTO, EntryType.CARTAO] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                            filterType === type 
                              ? "bg-app-accent text-app-accent-text border-app-accent shadow-sm" 
                              : "bg-app-card text-app-muted border-app-border hover:bg-opacity-80"
                          )}
                        >
                          {type === 'ALL' ? 'Todos' : type === EntryType.PONTO ? 'Ponto' : 'Cartão'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Filter */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest">Período</label>
                    <div className="grid grid-cols-1 gap-2">
                      <CalendarInput 
                        label="Data Inicial"
                        value={startDate || format(new Date(), 'yyyy-MM-dd')}
                        onChange={setStartDate}
                      />
                      <CalendarInput 
                        label="Data Final"
                        value={endDate || format(new Date(), 'yyyy-MM-dd')}
                        onChange={setEndDate}
                      />
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <button 
                      onClick={clearFilters}
                      className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all"
                    >
                      <X className="w-3 h-3" />
                      Limpar Filtros
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div 
            key="list-view"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <Filter className="w-8 h-8 text-app-muted mb-2" />
                <p className="text-xs font-bold text-app-muted uppercase tracking-widest">Nenhum resultado para estes filtros</p>
              </div>
            ) : (
              filteredEntries.map((entry, index) => (
                <motion.div 
                  key={entry.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="bg-app-card p-4 rounded-3xl shadow-sm border border-app-border flex items-center justify-between group transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                      entry.type === EntryType.PONTO 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                        : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                    )}>
                      {entry.type === EntryType.PONTO ? <Clock className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      <div className="text-xs font-bold text-app-muted uppercase tracking-widest mb-1 flex items-center gap-1.5 line-clamp-1">
                        {format(parseISO(entry.date), "dd 'de' MMMM", { locale: ptBR })}
                        <span className="w-1 h-1 rounded-full bg-app-border" />
                        <span className={cn(
                          "text-[9px] font-black leading-none",
                          entry.type === EntryType.PONTO ? "text-blue-500" : "text-emerald-500"
                        )}>
                          {entry.type === EntryType.PONTO ? 'PONTO' : 'CARTÃO'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-app-bg px-2 py-0.5 rounded-md text-app-text font-bold whitespace-nowrap border border-app-border">
                          {entry.entryTime} - {entry.exitTime}
                        </span>
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                          entry.percentage === 1.0 
                            ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" 
                            : "bg-app-bg text-app-muted border border-app-border"
                        )}>
                          +{entry.percentage * 100}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold tracking-tight text-app-text">
                        {formatCurrency(entry.calculatedValue)}
                      </div>
                      <div className="text-[10px] font-bold text-app-muted uppercase tracking-widest">
                        {entry.calculatedHours.toFixed(1)} HORAS
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(entry);
                        }}
                        className="p-1.5 text-app-muted hover:text-app-accent transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(entry.id);
                        }}
                        className="p-1.5 text-app-muted hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="calendar-view"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <HistoryCalendar entries={entries} onDayClick={handleCalendarDayClick} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for Calendar View
function HistoryCalendar({ entries, onDayClick }: { 
  entries: OvertimeEntry[], 
  onDayClick: (dateStr: string) => void
}) {
  const [viewDate, setViewDate] = useState(new Date());
  
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const entriesByDate = useMemo(() => {
    const map: Record<string, OvertimeEntry[]> = {};
    entries.forEach(entry => {
      if (!map[entry.date]) map[entry.date] = [];
      map[entry.date].push(entry);
    });
    return map;
  }, [entries]);

  return (
    <div className="bg-app-card rounded-[32px] border border-app-border overflow-hidden shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-app-accent leading-none block mb-1">
              {format(viewDate, 'yyyy')}
            </span>
            <h3 className="text-2xl font-bold text-app-text capitalize">
              {format(viewDate, 'MMMM', { locale: ptBR })}
            </h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="p-2.5 rounded-xl bg-app-bg border border-app-border text-app-muted hover:text-app-accent transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="p-2.5 rounded-xl bg-app-bg border border-app-border text-app-muted hover:text-app-accent transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="text-center text-[9px] font-black text-app-muted uppercase tracking-[0.15em]">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayEntries = entriesByDate[dateStr] || [];
            const isCurrentMonth = isSameMonth(day, monthStart);
            const totalVal = dayEntries.reduce((acc, curr) => acc + curr.calculatedValue, 0);

            return (
              <div 
                key={dateStr}
                onClick={() => dayEntries.length > 0 && onDayClick(dateStr)}
                className={cn(
                  "aspect-square relative flex items-center justify-center rounded-xl transition-all",
                  !isCurrentMonth && "opacity-10 pointer-events-none",
                  isCurrentMonth && "hover:bg-app-bg cursor-pointer group",
                  dayEntries.length > 0 ? "bg-app-accent/5 ring-1 ring-app-accent/20" : ""
                )}
              >
                <span className={cn(
                  "text-xs font-bold relative z-10",
                  dayEntries.length > 0 ? "text-app-accent" : "text-app-muted"
                )}>
                  {format(day, 'd')}
                </span>
                
                {dayEntries.length > 0 && (
                  <div className="absolute inset-1 rounded-lg bg-app-accent/10 pointer-events-none" />
                )}

                {/* Mini Indicators */}
                {dayEntries.length > 0 && (
                  <div className="absolute bottom-1.5 flex gap-0.5">
                    {dayEntries.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-app-accent" />
                    ))}
                  </div>
                )}
                
                {/* Visual Tooltip for amount */}
                {dayEntries.length > 0 && (
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-app-accent text-app-accent-text text-[8px] px-2 py-1 rounded-full font-bold whitespace-nowrap shadow-lg transition-all z-20 pointer-events-none">
                    {formatCurrency(totalVal)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="bg-app-bg/50 px-6 py-4 border-t border-app-border flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-app-accent" />
            <span className="text-[9px] font-bold text-app-muted uppercase tracking-wider">Com Registro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-app-muted/30" />
            <span className="text-[9px] font-bold text-app-muted uppercase tracking-wider">Vazio</span>
          </div>
        </div>
        <p className="text-[10px] font-bold text-app-muted italic opacity-60">
          Toque em um dia com registros para ver detalhes
        </p>
      </div>
    </div>
  );
}
