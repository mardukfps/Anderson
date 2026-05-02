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
  CircleCheck,
  TrendingUp,
  Wallet,
  Clock,
  Download,
  Bell,
  X
} from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { OvertimeEntry, AppSettings, DEFAULT_SETTINGS, EntryType } from './types';
import { cn, formatCurrency } from './lib/utils';
import Dashboard from './components/Dashboard';
import HistoryList from './components/HistoryList';
import EntryForm from './components/EntryForm';
import SettingsScreen from './components/SettingsScreen';
import { generatePDF } from './lib/pdf-export';
import { notificationService } from './services/notificationService';
import ConfirmationModal from './components/ConfirmationModal';

type Tab = 'dashboard' | 'history' | 'add' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editingEntry, setEditingEntry] = useState<OvertimeEntry | null>(null);
  const [entries, setEntries] = useLocalStorage<OvertimeEntry[]>('jornada_entries', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('jornada_settings', DEFAULT_SETTINGS);
  const [toast, setToast] = useState<{ title: string; message: string; isOpen: boolean }>({
    title: '',
    message: '',
    isOpen: false,
  });

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

  // Background checks for notifications
  useEffect(() => {
    const notifyHandler = (e: any) => {
      const { title, body } = e.detail;
      setToast({ title, message: body, isOpen: true });
      setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 5000);
    };

    window.addEventListener('jornada-notify', notifyHandler);
    
    notificationService.checkMonthlyLimit(entries, settings);
    notificationService.checkDailyReminder(entries, settings);

    const interval = setInterval(() => {
      notificationService.checkDailyReminder(entries, settings);
    }, 60000);

    return () => {
      window.removeEventListener('jornada-notify', notifyHandler);
      clearInterval(interval);
    };
  }, [entries, settings]);

  const addEntry = (entry: OvertimeEntry) => {
    setEntries(prev => [entry, ...prev]);
    setActiveTab('history');
  };

  const updateEntry = (updatedEntry: OvertimeEntry) => {
    setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
    setEditingEntry(null);
    setActiveTab('history');
  };

  const deleteEntry = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir Registro',
      message: 'Você tem certeza que deseja excluir este registro de horas extras?',
      confirmLabel: 'Excluir',
      isDanger: true,
      onConfirm: () => {
        setEntries(prev => prev.filter(e => e.id !== id));
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
      onConfirm: () => {
        setEntries([]);
      }
    });
  };

  const handleEdit = (entry: OvertimeEntry) => {
    setEditingEntry(entry);
    setActiveTab('add');
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const exportReport = () => {
    generatePDF(entries, settings);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#141414] pb-32 flex flex-col items-center selection:bg-gray-200">
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
              <Dashboard entries={entries} settings={settings} />
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
                <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
                <div className="flex gap-2">
                  <button 
                    onClick={exportReport}
                    className="flex items-center gap-2 text-sm font-medium bg-white px-3 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  {entries.length > 0 && (
                    <button 
                      onClick={clearEntries}
                      className="flex items-center gap-2 text-sm font-medium bg-red-50 text-red-600 px-3 py-2 rounded-xl shadow-sm hover:bg-red-100 transition-colors"
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
              <h1 className="text-2xl font-bold tracking-tight mb-6">
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
              <h1 className="text-2xl font-bold tracking-tight mb-6">Configurações</h1>
              <SettingsScreen settings={settings} onUpdate={updateSettings} onClearData={clearEntries} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-t border-gray-200 flex items-center justify-around px-6 z-50">
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
            "bg-[#141414] text-white"
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

      {/* Internal Toast Notification */}
      <AnimatePresence>
        {toast.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[200] w-full max-w-[320px]"
          >
            <div className="bg-[#141414] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex gap-3 items-center">
              <div className="bg-white/10 p-2 rounded-xl">
                <Bell className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-bold uppercase tracking-widest truncate">{toast.title}</div>
                <div className="text-[10px] text-white/60 leading-tight line-clamp-2">{toast.message}</div>
              </div>
              <button 
                onClick={() => setToast(prev => ({ ...prev, isOpen: false }))}
                className="p-1 text-white/30 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-[#141414] scale-105" : "text-gray-400"
      )}
    >
      <div className={cn("p-1 rounded-lg", active && "bg-gray-100")}>
        {icon}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  );
}
