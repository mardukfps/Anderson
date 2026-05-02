import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OvertimeEntry, EntryType } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Trash2, Edit3, Clock, CreditCard, Filter, X, Calendar } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesType = filterType === 'ALL' || entry.type === filterType;
      
      let matchesDate = true;
      if (startDate && entry.date < startDate) matchesDate = false;
      if (endDate && entry.date > endDate) matchesDate = false;

      return matchesType && matchesDate;
    });
  }, [entries, filterType, startDate, endDate]);

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
        <div className="bg-gray-100 p-8 rounded-full mb-2">
          <Clock className="w-12 h-12 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-400">Nenhum registro ainda</h3>
        <p className="text-sm text-gray-400 max-w-[200px]">Comece adicionando suas horas extras no botão central.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Exibindo {filteredEntries.length} de {entries.length} registros
          </p>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
              showFilters || hasActiveFilters ? "bg-[#141414] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            <Filter className="w-3 h-3" />
            Filtros
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
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
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4 mt-1">
                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tipo de Lançamento</label>
                  <div className="flex gap-2">
                    {(['ALL', EntryType.PONTO, EntryType.CARTAO] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                          filterType === type 
                            ? "bg-[#141414] text-white border-[#141414]" 
                            : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                        )}
                      >
                        {type === 'ALL' ? 'Todos' : type === EntryType.PONTO ? 'Ponto' : 'Cartão'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Filter */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Período</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-gray-200 transition-all font-mono"
                        placeholder="De"
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-gray-200 transition-all font-mono"
                        placeholder="Até"
                      />
                    </div>
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

      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
          <Filter className="w-8 h-8 text-gray-200 mb-2" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum resultado para estes filtros</p>
        </div>
      ) : (
        filteredEntries.map((entry, index) => (
        <motion.div 
          key={entry.id} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group transition-all hover:border-gray-300"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
              entry.type === EntryType.PONTO ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
            )}>
              {entry.type === EntryType.PONTO ? <Clock className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
            </div>
            
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                {format(parseISO(entry.date), "dd 'de' MMMM", { locale: ptBR })}
                <span className="w-1 h-1 rounded-full bg-gray-200" />
                <span className={cn(
                  "text-[9px] font-black leading-none",
                  entry.type === EntryType.PONTO ? "text-blue-500" : "text-emerald-500"
                )}>
                  {entry.type === EntryType.PONTO ? 'PONTO' : 'CARTÃO'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded-md text-gray-600 font-bold whitespace-nowrap">
                  {entry.entryTime} - {entry.exitTime}
                </span>
                <span className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                  entry.percentage === 1.0 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
                )}>
                  +{entry.percentage * 100}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-lg font-bold tracking-tight">
                {formatCurrency(entry.calculatedValue)}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {entry.calculatedHours.toFixed(1)} HORAS
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(entry);
                }}
                className="p-2.5 text-gray-400 hover:text-blue-500 rounded-xl hover:bg-blue-50 transition-all active:scale-95 bg-gray-50/50 sm:bg-transparent"
                title="Editar"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="p-2.5 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all active:scale-95 bg-gray-50/50 sm:bg-transparent"
                title="Excluir"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
        ))
      )}
    </div>
  );
}
