import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  History, 
  Plus, 
  Settings as SettingsIcon,
  Download,
  TrendingUp,
  Trash2,
  Crown
} from 'lucide-react';
import { onSnapshot, collection, doc, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import { OvertimeEntry, AppSettings, DEFAULT_SETTINGS, EntryType } from './types';
import { cn, formatCurrency } from './lib/utils';
import Dashboard from './components/Dashboard';
import HistoryList from './components/HistoryList';
import EntryForm from './components/EntryForm';
import SettingsScreen from './components/SettingsScreen';
import TrendsScreen from './components/TrendsScreen';
import Login from './components/Login';
import SubscriptionModal from './components/SubscriptionModal';
import { generatePDF } from './lib/pdf-export';
import ConfirmationModal from './components/ConfirmationModal';
import { apiService } from './services/api';
import { useAuth } from './hooks/useAuth';
import { testConnection } from './lib/firebase';
import Logo from './components/Logo';

type Tab = 'dashboard' | 'trends' | 'history' | 'add' | 'settings';

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editingEntry, setEditingEntry] = useState<OvertimeEntry | null>(null);
  const [entries, setEntries] = useState<OvertimeEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  const isPremium = settings.plan === 'premium' && (
    !settings.subscriptionExpiresAt || settings.subscriptionExpiresAt > Date.now()
  );

  // Auto-downgrade or Auto-renew simulation
  useEffect(() => {
    if (user && settings.plan === 'premium' && settings.subscriptionExpiresAt && settings.subscriptionExpiresAt < Date.now()) {
      if (settings.autoRenew !== false) {
        // Simulation: Auto-renew for another month if not cancelled
        const nextMonth = Date.now() + (30 * 24 * 60 * 60 * 1000);
        apiService.saveSettings(user.uid, { 
          ...settings, 
          subscriptionExpiresAt: nextMonth 
        }).catch(console.error);
      } else {
        // Downgrade to free if user cancelled (autoRenew is false)
        apiService.saveSettings(user.uid, { 
          ...settings, 
          plan: 'free', 
          subscriptionExpiresAt: undefined,
          autoRenew: undefined 
        }).catch(console.error);
      }
    }
  }, [user, settings.plan, settings.subscriptionExpiresAt, settings.autoRenew]);

  const showUpgradeModal = (featureName: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Assinar Premium',
      message: `O recurso "${featureName}" é exclusivo para assinantes Premium. Deseja conhecer nossos planos?`,
      confirmLabel: 'Conhecer Planos',
      isDanger: false,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setIsSubscriptionModalOpen(true);
      }
    });
  };

  const handleUpgrade = async (planType: 'monthly' | 'lifetime' = 'monthly', cardData?: any) => {
    if (!user) return;
    try {
      if (planType === 'monthly' && cardData) {
        // Monthly Subscription flow
        const idToken = await user.getIdToken(true);
        
        // Use a fixed plan or let server decide. We'll send "monthly" as a hint.
        // Card Brick provides token in cardData.token
        const response = await fetch('/api/subscription/subscribe', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            planId: 'monthly', // The backend will resolve this or create if needed
            cardTokenId: cardData.token,
            payerEmail: user.email,
            reason: 'Assinatura Jornada+ Premium'
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Erro ao processar assinatura');
        }

        const data = await response.json();
        
        if (data.status === 'authorized' || data.status === 'active') {
          // Success!
          const expiration = Date.now() + (30 * 24 * 60 * 60 * 1000);
          const upgradedSettings: AppSettings = { 
            ...settings, 
            plan: 'premium' as const,
            subscriptionExpiresAt: expiration,
            autoRenew: true,
            subscriptionStatus: 'confirmed'
          };
          
          await apiService.saveSettings(user.uid, upgradedSettings);
          setIsSubscriptionModalOpen(false);
          
          setModalConfig({
            isOpen: true,
            title: '🌟 Assinatura Ativada!',
            message: 'Sua assinatura mensal foi ativada com sucesso. Aproveite todos os recursos!',
            confirmLabel: 'Ótimo!',
            isDanger: false,
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
        return;
      }

      // Standard preference flow for lifetime
      const idToken = await user.getIdToken();
      const endpoint = '/api/create-payment';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          planType
        }),
      });
      
      if (response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 && !data.error) {
          logout();
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
        throw new Error(data.error || 'Acesso negado ou sessão expirada.');
      }

      const data = await response.json();
      
      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.error) {
        setModalConfig({
          isOpen: true,
          title: 'Erro no Pagamento',
          message: `${data.error}\n\nDetalhes: ${typeof data.details === 'object' ? JSON.stringify(data.details, null, 2) : data.details}`,
          confirmLabel: 'Entendido',
          isDanger: true,
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (error: any) {
      console.error('Error starting payment:', error);
      setModalConfig({
        isOpen: true,
        title: 'Erro de Conexão',
        message: error.message || 'Não foi possível conectar ao servidor de pagamentos. Verifique sua conexão.',
        confirmLabel: 'Entendido',
        isDanger: true,
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  // Payment success handling via URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const planType = urlParams.get('plan');
    
    if (paymentStatus === 'success' && user && settings.plan === 'free') {
      const isLifetime = planType === 'lifetime';
      const expiration = isLifetime ? (Date.now() + (100 * 365 * 24 * 60 * 60 * 1000)) : (Date.now() + (30 * 24 * 60 * 60 * 1000));
      
      const upgradedSettings: AppSettings = { 
        ...settings, 
        plan: 'premium' as const,
        subscriptionExpiresAt: expiration,
        autoRenew: true,
        subscriptionStatus: 'pending'
      };
      
      // Update settings in Cloud (onSnapshot will handle the UI state)
      apiService.saveSettings(user.uid, upgradedSettings).catch(console.error);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setModalConfig({
        isOpen: true,
        title: '🌟 Assinatura Ativada!',
        message: `Parabéns! Sua assinatura ${isLifetime ? 'Vitalícia' : 'Mensal'} está sendo processada. Em instantes ela será confirmada!`,
        confirmLabel: 'Aproveitar!',
        isDanger: false,
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  }, [user, settings.plan]);

  // Handle subscription confirmation delay (Simulation)
  const processingUser = useRef<string | null>(null);
  useEffect(() => {
    if (user && settings.plan === 'premium' && settings.subscriptionStatus === 'pending') {
      const uniqueProcessId = `${user.uid}-${settings.subscriptionExpiresAt}`;
      if (processingUser.current === uniqueProcessId) return;
      
      processingUser.current = uniqueProcessId;
      const timer = setTimeout(() => {
        apiService.saveSettings(user.uid, { ...settings, subscriptionStatus: 'confirmed' })
          .then(() => {
             processingUser.current = null;
          })
          .catch(err => {
            console.error(err);
            processingUser.current = null;
          });
      }, 5000); // 5 seconds simulation
      return () => clearTimeout(timer);
    }
  }, [user, settings.plan, settings.subscriptionStatus]);

  const confirmNavigation = (nextTab: Tab) => {
    if (nextTab === 'trends' && !isPremium) {
      showUpgradeModal('Tendências e Gráficos');
      return;
    }

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

  const handleCancelSubscription = () => {
    if (!user) return;
    setModalConfig({
      isOpen: true,
      title: 'Cancelar Assinatura',
      message: 'Tem certeza que deseja cancelar sua assinatura mensal? Seus benefícios Premium continuarão ativos até o fim do período já pago.',
      confirmLabel: 'Confirmar Cancelamento',
      isDanger: true,
      onConfirm: async () => {
        try {
          const updatedSettings = { 
            ...settings, 
            autoRenew: false
          };
          await apiService.saveSettings(user.uid, updatedSettings);
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Failed to cancel subscription:', error);
        }
      }
    });
  };

  const addEntry = async (entry: OvertimeEntry) => {
    if (!user) return;
    if (!isPremium && entries.length >= 10) {
      showUpgradeModal('Limite de Registros');
      return;
    }
    try {
      await apiService.addEntry(user.uid, entry);
      setActiveTab('history');
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
      setActiveTab('history');
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
  }, [settings.theme]);

  const exportReport = () => {
    if (!isPremium) {
      showUpgradeModal('Exportação de Relatórios');
      return;
    }
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
    <div className="min-h-screen bg-app-bg font-sans text-app-text pb-28 flex flex-col items-center selection:bg-gray-200 dark:selection:bg-gray-800 transition-colors duration-300">
      {isOffline && (
        <div className="w-full bg-red-500/10 border-b border-red-500/20 py-2 px-4 text-center sticky top-0 z-[60] backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
            Você está offline. Verifique sua conexão para salvar seus dados.
          </p>
        </div>
      )}
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
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-app-text">Configurações</h1>
              </div>
              <SettingsScreen 
                settings={settings} 
                user={user}
                onUpdate={updateSettings} 
                onUpgrade={() => setIsSubscriptionModalOpen(true)}
                onThemePreview={(theme) => setPendingTheme(theme)}
                onClearHistory={clearEntries}
                onLogout={logout}
                onCancelSubscription={handleCancelSubscription}
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
            whileTap={{ scale: 0.9, y: -20 }}
            initial={{ y: -20 }}
            animate={{ y: -24 }}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all border-4 border-app-bg z-10",
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

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onUpgrade={handleUpgrade}
        currentPlan={settings.plan}
        isLifetime={settings.plan === 'premium' && !!settings.subscriptionExpiresAt && settings.subscriptionExpiresAt > Date.now() + (365 * 24 * 60 * 60 * 1000 * 5)}
        subscriptionStatus={settings.subscriptionStatus}
      />

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
