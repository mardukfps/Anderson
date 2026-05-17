import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  History, 
  Plus, 
  Settings as SettingsIcon,
  Download,
  TrendingUp,
  Trash2,
  Check
} from 'lucide-react';
import { onSnapshot, collection, doc, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import { OvertimeEntry, AppSettings, DEFAULT_SETTINGS } from './types';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import HistoryList from './components/HistoryList';
import EntryForm from './components/EntryForm';
import SettingsScreen from './components/SettingsScreen';
import TrendsScreen from './components/TrendsScreen';
import Login from './components/Login';
import { generatePDF } from './lib/pdf-export';
import ConfirmationModal from './components/ConfirmationModal';
import { apiService } from './services/api';
import { useAuth } from './hooks/useAuth';
import { testConnection } from './lib/firebase';

type Tab = 'dashboard' | 'trends' | 'history' | 'add' | 'settings';

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const hash = window.location.hash.replace('#', '') as Tab;
    return (['dashboard', 'trends', 'history', 'add', 'settings'].includes(hash) ? hash : 'dashboard');
  });

  // Redirect to dashboard after login
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (!prevUserRef.current && user) {
      setActiveTab('dashboard');
    }
    prevUserRef.current = user;
  }, [user]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Tab;
      if (['dashboard', 'trends', 'history', 'add', 'settings'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (activeTab) {
      window.location.hash = activeTab;
    }
  }, [activeTab]);
  const [editingEntry, setEditingEntry] = useState<OvertimeEntry | null>(null);
  const [entries, setEntries] = useState<OvertimeEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showSuccess, setShowSuccess] = useState(false);
  const isNotVerified = user && !user.emailVerified;

  useEffect(() => {
    testConnection();
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    if (!user) {
      setEntries([]);
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }

    // Ensure user profile exists for rules and consistency
    apiService.ensureUserProfile(user.uid, user.email || '', user.displayName || 'Usuário');

    setIsLoading(true);

    // Real-time Settings Listener
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'config');
    const unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Settings listener error:', error);
      setIsLoading(false);
    });

    // Real-time Entries Listener
    const entriesRef = collection(db, 'users', user.uid, 'entries');
    const q = query(entriesRef, orderBy('createdAt', 'desc'));
    const unsubscribeEntries = onSnapshot(q, (snapshot) => {
      const fetchedEntries = snapshot.docs.map(doc => doc.data() as OvertimeEntry);
      setEntries(fetchedEntries);
    }, (error) => {
      console.error('Entries listener error:', error);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeEntries();
    };
  }, [user]);

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
            setActiveTab(nextTab);
          } catch (error) {
            console.error('Failed to apply theme during navigation:', error);
          }
        },
        onCancel: () => {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark', 'high-contrast', 'sky', 'ruby', 'emerald', 'amber');
          root.classList.add(settings.theme);
          setPendingTheme(null);
          setModalConfig(p => ({ ...p, isOpen: false }));
          setActiveTab(nextTab);
        }
      } as any);
      return;
    }
    
    setActiveTab(nextTab);
  };

  const addEntry = async (entry: OvertimeEntry) => {
    if (!user) return;
    try {
      await apiService.addEntry(user.uid, entry);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setActiveTab('history');
      }, 1500);
    } catch (error) {
      console.error('Failed to add entry:', error);
      setModalConfig({
        isOpen: true,
        title: 'Erro ao Salvar',
        message: 'Não foi possível salvar o registro. Verifique sua conexão e tente novamente.',
        confirmLabel: 'Entendido',
        isDanger: true,
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const updateEntry = async (updatedEntry: OvertimeEntry) => {
    if (!user) return;
    try {
      await apiService.updateEntry(user.uid, updatedEntry.id, updatedEntry);
      setEditingEntry(null);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setActiveTab('history');
      }, 1500);
    } catch (error) {
      console.error('Failed to update entry:', error);
      setModalConfig({
        isOpen: true,
        title: 'Erro ao Atualizar',
        message: 'Não foi possível atualizar o registro. Tente novamente.',
        confirmLabel: 'Entendido',
        isDanger: true,
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const deleteEntry = (id: string) => {
    if (!user) return;
    setModalConfig({
      isOpen: true,
      title: 'Excluir Registro',
      message: 'Você tem certeza que deseja excluir este registro de horas extras?',
      confirmLabel: 'Excluir',
      isDanger: true,
      onConfirm: async () => {
        try {
          await apiService.deleteEntry(user.uid, id);
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Failed to delete entry:', error);
        }
      }
    });
  };

  const clearEntries = () => {
    if (!user) return;
    setModalConfig({
      isOpen: true,
      title: 'Limpar Todo Histórico',
      message: 'ATENÇÃO: Isso apagará TODOS os seus registros permanentemente. Esta ação não poderá ser desfeita.',
      confirmLabel: 'Limpar Tudo',
      isDanger: true,
      onConfirm: async () => {
        try {
          await apiService.clearEntries(user.uid);
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
    if (!user) return;
    try {
      await apiService.saveSettings(user.uid, newSettings);
      setPendingTheme(null);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'high-contrast', 'sky', 'ruby', 'emerald', 'amber');
    
    // Add theme class
    root.classList.add(settings.theme);

    // Update theme-color meta tag
    let themeColor = '#38BDF8'; // Default
    if (settings.theme === 'dark') themeColor = '#0A0A0A';
    if (settings.theme === 'light') themeColor = '#F8F9FA';
    if (settings.theme === 'sky') themeColor = '#0F172A';
    if (settings.theme === 'ruby') themeColor = '#1A0B0B';
    if (settings.theme === 'emerald') themeColor = '#061A13';
    if (settings.theme === 'amber') themeColor = '#1C1206';

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    }
  }, [settings.theme]);

  const exportReport = () => {
    generatePDF(entries, settings);
  };

  if (authLoading || (user && isLoading)) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-app-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-app-bg font-sans text-app-text pb-28 flex flex-col items-center selection:bg-app-accent selection:text-app-accent-text transition-colors duration-500">
      {isOffline && (
        <div className="w-full bg-red-500/10 border-b border-red-500/20 py-2 px-4 text-center sticky top-0 z-[60] backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-500 animate-pulse">
            Você está offline. Verifique sua conexão para salvar seus dados.
          </p>
        </div>
      )}
      {isNotVerified && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 text-center sticky top-0 z-[60] backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
            E-mail não verificado. Você poderá apenas visualizar seus dados. Verifique seu e-mail para salvar registros.
          </p>
        </div>
      )}
      {/* Dynamic Content area */}
      <main className="w-full max-w-lg p-6 md:p-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <TrendsScreen entries={entries} settings={settings} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-app-bg/95 backdrop-blur-md z-50 py-4 -mx-6 md:-mx-10 px-6 md:px-10 border-b border-app-border/40">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-app-text">Histórico</h1>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-app-muted opacity-60">Seus registros salvos</p>
                </div>
                <div className="flex gap-2">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={exportReport}
                    className="p-3 rounded-2xl bg-app-card border border-app-border hover:border-app-accent transition-all shadow-sm"
                    title="Exportar PDF"
                  >
                    <Download className="w-5 h-5 text-app-accent" />
                  </motion.button>
                  {entries.length > 0 && (
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearEntries}
                      className="p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                      title="Limpar Histórico"
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="space-y-1 mb-8">
                <h1 className="text-3xl font-black tracking-tighter text-app-text">
                  {editingEntry ? 'Editar' : 'Registro'}
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-app-muted opacity-40">
                  {editingEntry ? 'Atualize os dados' : 'Adicione suas horas extras'}
                </p>
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
            >
              <div className="space-y-1 mb-8 text-left">
                <h1 className="text-3xl font-bold tracking-tight text-app-text">Ajustes</h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-app-muted opacity-60">Personalize sua experiência</p>
              </div>
              <SettingsScreen 
                settings={settings} 
                user={user}
                onUpdate={updateSettings} 
                onThemePreview={(theme) => setPendingTheme(theme)}
                onClearHistory={clearEntries}
                onLogout={logout}
                onSaveSuccess={() => setActiveTab('dashboard')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-app-card border-t border-app-border grid grid-cols-5 items-center px-4 z-50 transition-colors shadow-lg">
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
          label="Insights" 
        />
        
        <div className="flex justify-center">
          <motion.button 
            onClick={() => {
              setEditingEntry(null);
              confirmNavigation('add');
            }}
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9, y: -20 }}
            initial={{ y: -20 }}
            animate={{ y: -24 }}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-4 border-app-bg z-10",
              "bg-app-accent text-app-accent-text"
            )}
          >
            <Plus className="w-8 h-8 stroke-[3]" />
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

      {/* Success Feedback Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-app-bg/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="bg-app-card p-8 rounded-[2.5rem] border border-app-border shadow-2xl flex flex-col items-center gap-4 text-center max-w-[200px]"
            >
              <div className="w-16 h-16 rounded-full bg-app-accent/20 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20, 
                    delay: 0.2 
                  }}
                >
                  <Check className="w-8 h-8 text-app-accent stroke-[3]" />
                </motion.div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-tighter text-app-text">Sucesso!</p>
                <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.1em]">Registro salvo</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        "text-[8px] font-black uppercase tracking-[0.1em] transition-all",
        active ? "opacity-100 text-app-accent" : "opacity-60"
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
