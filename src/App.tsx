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
  Download
} from 'lucide-react';
import { OvertimeEntry, AppSettings, DEFAULT_SETTINGS, EntryType } from './types';
import { cn, formatCurrency } from './lib/utils';
import Dashboard from './components/Dashboard';
import HistoryList from './components/HistoryList';
import EntryForm from './components/EntryForm';
import SettingsScreen from './components/SettingsScreen';
import { generatePDF } from './lib/pdf-export';
import ConfirmationModal from './components/ConfirmationModal';
import { apiService } from './services/api';

type Tab = 'dashboard' | 'history' | 'add' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editingEntry, setEditingEntry] = useState<OvertimeEntry | null>(null);
  const [entries, setEntries] = useState<OvertimeEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
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
    document.documentElement.classList.add('dark');
    loadInitialData();
  }, []);

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
    try {
      const savedSettings = await apiService.saveSettings(newSettings);
      setSettings(savedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const exportReport = () => {
    generatePDF(entries, settings);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0A0A0A] font-sans text-[#141414] dark:text-gray-100 pb-32 flex flex-col items-center selection:bg-gray-200 dark:selection:bg-gray-800 transition-colors duration-300">
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

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight dark:text-white">Histórico</h1>
                <div className="flex gap-2">
                  <button 
                    onClick={exportReport}
                    className="flex items-center gap-2 text-sm font-medium bg-white dark:bg-white/5 text-[#141414] dark:text-white px-3 py-2 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors border dark:border-white/5"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  {entries.length > 0 && (
                    <button 
                      onClick={clearEntries}
                      className="flex items-center gap-2 text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border dark:border-white/5"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
              <HistoryList entries={entries} onDelete={deleteEntry} onEdit={handleEdit} />
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h1 className="text-2xl font-bold tracking-tight mb-6 dark:text-white">
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
              <h1 className="text-2xl font-bold tracking-tight mb-6 dark:text-white">Configurações</h1>
              <SettingsScreen 
                settings={settings} 
                onUpdate={updateSettings} 
                onClearData={clearEntries}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-gray-200 dark:border-white/5 flex items-center justify-around px-6 z-50 transition-colors">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => {
            setActiveTab('dashboard');
            setEditingEntry(null);
          }} 
          icon={<LayoutDashboard />} 
          label="Início" 
        />
        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => {
            setActiveTab('history');
            setEditingEntry(null);
          }} 
          icon={<History />} 
          label="Histórico" 
        />
        <button 
          onClick={() => {
            setEditingEntry(null);
            setActiveTab('add');
          }}
          className={cn(
            "relative -top-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
            "bg-[#141414] dark:bg-white text-white dark:text-black"
          )}
        >
          <Plus className="w-8 h-8" />
        </button>
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => {
            setActiveTab('settings');
            setEditingEntry(null);
          }} 
          icon={<SettingsIcon />} 
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
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-white scale-105" : "text-gray-400 dark:text-gray-600"
      )}
    >
      <div className={cn("p-1 rounded-lg transition-colors", active && "bg-white/10")}>
        {icon}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  );
}
