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
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States for custom modals
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    isDanger: boolean;
    onConfirm: () => void;
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
    if (activeTab === 'settings' && pendingTheme && pendingTheme !== settings.theme) {
      setModalConfig({
        isOpen: true,
        title: 'Aplicar Tema?',
        message: `Você selecionou um novo tema. Deseja aplicar esta alteração antes de sair?`,
        confirmLabel: 'Sim, aplicar',
        isDanger: false,
        onConfirm: async () => {
          try {
            const updatedSettings = { ...settings, theme: pendingTheme as any };
            await updateSettings(updatedSettings);
            setPendingTheme(null);
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            setActiveTab('dashboard'); // Return to initial screen as requested
          } catch (error) {
            console.error('Failed to apply theme during navigation:', error);
          }
        },
        onCancel: () => {
          // Revert classes immediately to the saved theme
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark', 'high-contrast');
          root.classList.add(settings.theme);
          
          setPendingTheme(null);
          setSettings({ ...settings }); // Trigger child effect to reset display theme
          setModalConfig(p => ({ ...p, isOpen: false }));
          // We stay on the current tab (settings) if they don't want to apply
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
      setPendingTheme(null);
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
    <div className="min-h-screen bg-app-bg font-sans text-app-text pb-32 flex flex-col items-center selection:bg-gray-200 dark:selection:bg-gray-800 transition-colors duration-300">
      {/* Dynamic Content area */}
      <main className="w-full max-w-lg p-5 md:p-8 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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
            >
              <TrendsScreen entries={entries} settings={settings} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-app-text">Histórico</h1>
                <div className="flex gap-2">
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={exportReport}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-app-card text-app-text px-4 py-3 rounded-xl shadow-sm hover:border-app-accent/30 transition-all border border-app-border"
                  >
                    <Download className="w-4 h-4 text-app-accent" />
                    PDF
                  </motion.button>
                  {entries.length > 0 && (
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearEntries}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl shadow-sm hover:bg-red-500 hover:text-white transition-all border border-app-border"
                    >
                      <Trash2 className="w-4 h-4" />
                      Limpar
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h1 className="text-2xl font-bold tracking-tight mb-6 text-app-text">
                {editingEntry ? 'Editar Registro' : 'Novo Registro'}
              </h1>
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h1 className="text-2xl font-bold tracking-tight mb-6 text-app-text">Configurações</h1>
              <SettingsScreen 
                settings={settings} 
                onUpdate={updateSettings} 
                onThemePreview={(theme) => setPendingTheme(theme)}
                onClearHistory={clearEntries}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-app-card/90 backdrop-blur-xl border-t border-app-border grid grid-cols-5 items-center px-2 z-50 transition-colors shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)]">
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
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9, y: 0 }}
            initial={{ y: -20 }}
            animate={{ y: -24 }}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all border-4 border-app-bg",
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

      {/* Footer Credits */}
      <footer className="mt-auto py-8 text-center px-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity">
          Desenvolvido por Anderson Silva
        </p>
      </footer>

      {/* Custom Confirmation Modal */}
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmLabel={modalConfig.confirmLabel}
        isDanger={modalConfig.isDanger}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => {
          if ((modalConfig as any).onCancel) {
            (modalConfig as any).onCancel();
          } else {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
          }
        }}
      />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <motion.button 
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 py-1 transition-all h-full",
        active ? "text-app-accent" : "text-app-muted opacity-60"
      )}
    >
      <div className={cn(
        "p-2 rounded-2xl transition-all duration-300 flex items-center justify-center", 
        active ? "bg-app-accent/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[9px] font-bold uppercase tracking-widest transition-all",
        active ? "opacity-100 scale-110" : "opacity-70 scale-100"
      )}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-pill"
          className="w-1 h-1 rounded-full bg-app-accent"
        />
      )}
    </motion.button>
  );
}
