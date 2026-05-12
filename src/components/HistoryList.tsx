import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OvertimeEntry, EntryType } from '../types';
import { formatCurrency, cn, formatExactHours } from '../lib/utils';
import { 
  Trash2, Edit3, Clock, CreditCard, Filter, X, Search, FileText
} from 'lucide-react';
import { 
  format, parseISO
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
  const [showFilters, setShowFilters] = useState(false);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      return filterType === 'ALL' || entry.type === filterType;
    });
  }, [entries, filterType]);

  const clearFilters = () => {
    setFilterType('ALL');
  };

  const hasActiveFilters = filterType !== 'ALL';

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
      {/* Filter Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest px-1">
            Exibindo {filteredEntries.length} de {entries.length} registros
          </p>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all h-9 whitespace-nowrap",
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
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest">Filtrar por Tipo</label>
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

                  {hasActiveFilters && (
                    <button 
                      onClick={clearFilters}
                      className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all"
                    >
                      <X className="w-3 h-3" />
                      Limpar Filtro
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      <div className="space-y-3">
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
              className="bg-app-card p-5 rounded-2xl border border-app-border flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border",
                  entry.type === EntryType.PONTO 
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/10" 
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/10"
                )}>
                  {entry.type === EntryType.PONTO ? <Clock className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-app-text">
                      {format(parseISO(entry.date), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                    <span className={cn(
                      "text-[8px] font-bold px-2 py-0.5 rounded-md uppercase",
                      entry.type === EntryType.PONTO 
                        ? "bg-blue-500/10 text-blue-600" 
                        : "bg-emerald-500/10 text-emerald-600"
                    )}>
                      {entry.type === EntryType.PONTO ? 'Ponto' : 'Cartão'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-app-muted font-medium">
                    <span>{entry.entryTime} — {entry.exitTime}</span>
                    <span className="text-app-border">•</span>
                    <span className="text-app-accent font-bold">{entry.multiplier === 1.5 ? '50%' : '100%'}</span>
                    {entry.isNightShift && (
                      <>
                        <span className="text-app-border">•</span>
                        <span className="text-blue-500 font-bold">Noturno</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-4">
                <div className="text-right">
                  <div className="text-lg font-bold tracking-tight text-app-text leading-none mb-1">
                    {formatCurrency(entry.calculatedValue)}
                  </div>
                  <div className="text-[10px] font-bold text-app-muted">
                    {formatExactHours(entry.calculatedHours)}h
                  </div>
                </div>

                <div className="flex items-center gap-1 border-l border-app-border pl-3 ml-2">
                  <button 
                    onClick={() => onEdit(entry)}
                    className="p-2 text-app-muted hover:text-app-accent transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(entry.id)}
                    className="p-2 text-app-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
