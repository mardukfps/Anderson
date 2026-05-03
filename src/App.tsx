/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  History, 
  Plus, 
  Settings as SettingsIcon,
  Download,
  TrendingUp,
  Trash2
} from 'lucide-react';
import { OvertimeEntry, AppSettings, DEFAULT_SETTINGS, EntryType } from './types';
import { cn, formatCurrency } from './lib/utils';
import Dashboard from './components/Dashboard';
import HistoryList from './components/HistoryList';
import EntryForm from './components/EntryForm';
import SettingsScreen from './components/SettingsScreen';
import TrendsScreen from './components/TrendsScreen';
import { generatePDF } from './lib/pdf-export';
import ConfirmationModal from './components/ConfirmationModal';
import { apiService } from './services/api';

type Tab = 'dashboard' | 'trends' | 'history' | 'add' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editingEntry, setEditingEntry] = useState<OvertimeEntry | null>(null);
  const [entries, setEntries] = useState<OvertimeEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [pendingSettings, setPendingSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States for custom modals
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    isDanger: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
    onStay?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    isDanger: false,
    onConfirm: () => {},
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const confirmNavigation = (nextTab: Tab) => {
    if (activeTab === 'settings' && pendingSettings) {
      setModalConfig({
        isOpen: true,
        title: 'Alterações Pendentes',
        message: 'Você fez mudanças nas configurações. Deseja salvá-las antes de sair?',
        confirmLabel: 'Salvar e Sair',
        cancelLabel: 'Sair sem Salvar',
        isDanger: false,
        onConfirm: async () => {
          try {
            await updateSettings(pendingSettings);
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            setEditingEntry(null);
            setActiveTab(nextTab); 
          } catch (error) {
            console.error('Failed to save settings during navigation:', error);
          }
        },
        onCancel: () => {
          // Discard changes and move
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark', 'high-contrast');
          root.classList.add(settings.theme);
          
          setPendingSettings(null);
          setModalConfig(p => ({ ...p, isOpen: false }));
          setEditingEntry(null);
          setActiveTab(nextTab);
        },
        onStay: () => {
          // Just close modal and stay here
          setModalConfig(p => ({ ...p, isOpen: false }));
        }
      } as any);
      
      return;
    }
    
    setActiveTab(nextTab);
  };

  const loadInitialData = async () => {
    try {
      const [fetchedEntries, fetchedSettings] = await Promise.all([
        apiService.getEntries(),
        apiService.getSettings()
      ]);
      setEntries(fetchedEntries);
      if (fetchedSettings) {
        setSettings(fetchedSettings);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (entry: OvertimeEntry) => {
    try {
      const newEntry = await apiService.addEntry(entry);
      setEntries(prev => [newEntry, ...prev]);
      setActiveTab('history');
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('Erro ao salvar o registro. Tente novamente.');
    }
  };

  const updateEntry = async (updatedEntry: OvertimeEntry) => {
    try {
      await apiService.updateEntry(updatedEntry.id, updatedEntry);
      setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
      setEditingEntry(null);
      setActiveTab('history');
    } catch (error) {
      console.error('Failed to update entry:', error);
      alert('Erro ao atualizar o registro. Tente novamente.');
    }
  };

  const deleteEntry = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir Registro',
      message: 'Você tem certeza que deseja excluir este registro de horas extras?',
      confirmLabel: 'Excluir',
      isDanger: true,
      onConfirm: async () => {
        try {
          await apiService.deleteEntry(id);
          setEntries(prev => prev.filter(e => e.id !== id));
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Failed to delete entry:', error);
        }
      }
    });
  };

  const clearEntries = () => {
    setModalConfig({
      isOpen: true,
      title: 'Limpar Todo Histórico',
      message: 'ATENÇÃO: Isso apagará TODOS os seus registros permanentemente. Esta ação não poderá ser desfeita.',
      confirmLabel: 'Limpar Tudo',
      isDanger: true,
      onConfirm: async () => {
        try {
          await apiService.clearEntries();
          setEntries([]);
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Failed to clear entries:', error);
        }
      }
    });
  };

  const handleEdit = (entry: OvertimeEntry) => {
    setEditingEntry(entry);
    setActiveTab('add');
  };

  const updateSettings = async (newSettings: AppSettings) => {
    console.log('Attempting to update settings:', newSettings);
    try {
      const savedSettings = await apiService.saveSettings(newSettings);
      console.log('Settings saved successfully:', savedSettings);
      setSettings(savedSettings);
      setPendingSettings(null);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error; // Re-throw to be caught by the caller UI
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'high-contrast');
    
    // Add theme class
    root.classList.add(settings.theme);
  }, [settings.theme]);

  const exportReport = () => {
    generatePDF(entries, settings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-app-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg font-sans text-app-text flex flex-col items-center selection:bg-gray-200 dark:selection:bg-gray-800 transition-colors duration-300 overflow-hidden">
      {/* Safe Area Top */}
      <div className="safe-top w-full bg-app-bg shrink-0" />

      {/* Dynamic Content area */}
      <main className="w-full max-w-lg flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 p-5 pt-2 overflow-y-auto pb-32"
            >
              <Dashboard 
                entries={entries} 
                settings={settings} 
                onNavigateToSettings={() => setActiveTab('settings')} 
              />
            </motion.div>
          )}

          {activeTab === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 p-5 pt-2 overflow-y-auto pb-32"
            >
              <TrendsScreen entries={entries} settings={settings} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 p-5 pt-2 overflow-y-auto pb-32"
            >
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-black tracking-tight text-app-text">Histórico</h1>
                <div className="flex gap-2">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={exportReport}
                    className="p-3 rounded-2xl bg-app-card border border-app-border shadow-sm active:bg-app-bg transition-colors"
                  >
                    <Download className="w-5 h-5 text-app-accent" />
                  </motion.button>
                  {entries.length > 0 && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearEntries}
                      className="p-3 rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/20 active:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              </div>
              <HistoryList 
                entries={entries} 
                onDelete={deleteEntry} 
                onEdit={handleEdit} 
              />
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-0 p-5 pt-2 bg-app-bg z-40 overflow-y-auto pb-32"
            >
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-black tracking-tight text-app-text">
                  {editingEntry ? 'Editar' : 'Novo Registro'}
                </h1>
                <button 
                  onClick={() => { setEditingEntry(null); setActiveTab('dashboard'); }} 
                  className="p-2 text-app-accent font-bold text-sm"
                >
                  Cancelar
                </button>
              </div>
              <div key={editingEntry ? `edit-${editingEntry.id}` : 'new'}>
                <EntryForm 
                  onSubmit={editingEntry ? updateEntry : addEntry} 
                  settings={settings} 
                  initialEntry={editingEntry || undefined}
                  onCancel={() => {
                    setEditingEntry(null);
                    setActiveTab('history');
                  }}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 p-5 pt-2 overflow-y-auto pb-32"
            >
              <h1 className="text-3xl font-black tracking-tight mb-6 text-app-text">Ajustes</h1>
              <SettingsScreen 
                settings={settings} 
                onPendingChanges={(changes) => setPendingSettings(changes)}
                onThemePreview={(theme) => {
                  // This is just for live preview, no need to set state
                }}
                onClearHistory={clearEntries}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 glass border-t border-app-border grid grid-cols-5 items-start pt-3 px-2 z-50 transition-colors shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)] safe-bottom">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => {
            confirmNavigation('dashboard');
            setEditingEntry(null);
          }} 
          icon={<LayoutDashboard className="w-5 h-5" />} 
          label="Início" 
        />
        <NavButton 
          active={activeTab === 'trends'} 
          onClick={() => {
            confirmNavigation('trends');
            setEditingEntry(null);
          }} 
          icon={<TrendingUp className="w-5 h-5" />} 
          label="Gráficos" 
        />
        
        <div className="flex justify-center">
          <motion.button 
            onClick={() => {
              setEditingEntry(null);
              confirmNavigation('add');
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ y: -20 }}
            animate={{ y: -24 }}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all border-4 border-app-bg z-[60]",
              "bg-app-accent text-app-accent-text"
            )}
          >
            <Plus className="w-8 h-8" />
          </motion.button>
        </div>

        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => {
            confirmNavigation('history');
            setEditingEntry(null);
          }} 
          icon={<History className="w-5 h-5" />} 
          label="Histórico" 
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => {
            confirmNavigation('settings');
            setEditingEntry(null);
          }} 
          icon={<SettingsIcon className="w-5 h-5" />} 
          label="Ajustes" 
        />
      </nav>

      {/* Footnote hidden on small screens or adapted */}
      <footer className="fixed bottom-1 py-1 w-full text-center z-[100] pointer-events-none md:block hidden">
        <p className="text-[8px] font-bold text-app-muted uppercase tracking-[0.2em] opacity-40">
          Desenvolvido por Anderson Silva
        </p>
      </footer>

      {/* Custom Confirmation Modal */}
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmLabel={modalConfig.confirmLabel}
        cancelLabel={modalConfig.cancelLabel}
        isDanger={modalConfig.isDanger}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => {
          if (modalConfig.onCancel) {
            modalConfig.onCancel();
          } else {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
          }
        }}
        onStay={modalConfig.onStay}
      />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <motion.button 
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-1 transition-all h-full",
        active ? "text-app-accent" : "text-app-muted opacity-60"
      )}
    >
      <div className={cn(
        "transition-all duration-300 flex items-center justify-center translate-y-1", 
        active ? "scale-110" : "scale-100"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[9px] font-bold uppercase tracking-widest transition-all mt-1",
        active ? "opacity-100" : "opacity-70"
      )}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-pill"
          className="w-1 h-1 rounded-full bg-app-accent shrink-0 mt-0.5"
        />
      )}
    </motion.button>
  );
}
