import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, CheckCircle2, ArrowRight, X, Loader2, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import CardForm from './CardForm';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planType: 'monthly' | 'lifetime', cardData?: any) => Promise<void>;
  currentPlan: string;
  isLifetime?: boolean;
  subscriptionStatus?: 'pending' | 'confirmed';
}

export default function SubscriptionModal({ 
  isOpen, 
  onClose, 
  onUpgrade, 
  currentPlan, 
  isLifetime,
  subscriptionStatus 
}: SubscriptionModalProps) {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'lifetime' | null>(null);

  const isPending = subscriptionStatus === 'pending';

  const handlePlanSelect = (planId: 'monthly' | 'lifetime') => {
    if (planId === 'monthly') {
      setSelectedPlanId('monthly');
      setShowCardForm(true);
    } else {
      handleUpgradeClick('lifetime');
    }
  };

  const handleUpgradeClick = async (planType: 'monthly' | 'lifetime', cardData?: any) => {
    setLoadingPlan(planType);
    setError(null);
    try {
      await onUpgrade(planType, cardData);
    } catch (err: any) {
      console.error('Error starting upgrade:', err);
      setError(err.message || 'Erro ao iniciar pagamento');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCardSubmit = async (cardFormData: any) => {
    await handleUpgradeClick('monthly', cardFormData);
  };
  
  // Update the plans array...

  const plans = [
    {
      id: 'monthly',
      name: 'Plano Mensal',
      price: 'R$ 5.99',
      period: '/mês',
      description: 'Assinatura mensal recorrente. Cancele quando quiser.',
      benefits: [
        'Registros ilimitados',
        'Exportação PDF completa',
        'Gráficos e tendências',
        'Suporte prioritário'
      ],
      highlight: false,
      cta: 'Contratar Premium'
    },
    {
      id: 'lifetime',
      name: 'Vitalício',
      price: 'R$ 14.99',
      period: '',
      description: 'Pagamento único. Acesso total para sempre, sem mensalidades.',
      benefits: [
        'Tudo do Plano Mensal',
        'Acesso vitalício',
        'Pagamento Único',
        'Economia de longo prazo'
      ],
      highlight: true,
      cta: 'Comprar Vitalício'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-app-bg border border-app-border rounded-[40px] shadow-2xl overflow-y-auto no-scrollbar pb-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-app-card border border-app-border rounded-full text-app-muted hover:text-app-text transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {showCardForm && (
              <button 
                onClick={() => setShowCardForm(false)}
                className="absolute top-6 left-6 p-2 bg-app-card border border-app-border rounded-xl text-app-muted hover:text-app-text transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-widest z-10"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
            )}

            <>
              {/* Header */}
              <div className="text-center pt-12 pb-2 px-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-app-accent/10 text-app-accent rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Crown className="w-8 h-8" />
                </motion.div>
                <h2 className="text-3xl font-black tracking-tighter text-app-text mb-3 uppercase">Assinatura Premium</h2>
                <p className="text-app-muted font-medium max-w-xs mx-auto text-sm">
                  Escolha o plano ideal para você e desbloqueie todos os recursos!
                </p>

                {isPending && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 mx-10 p-5 bg-amber-500/10 border border-amber-500/20 rounded-[32px] flex flex-col items-center gap-3"
                  >
                    <div className="flex items-center gap-3 text-amber-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs font-black uppercase tracking-widest">Processando Pagamento...</span>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold max-w-xs">
                      Estamos aguardando a confirmação do seu pagamento. Isso geralmente leva alguns segundos. Por favor, aguarde.
                    </p>
                  </motion.div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-left"
                    >
                      <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-black">!</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Erro</p>
                        <p className="text-xs text-red-700 dark:text-red-400 font-medium whitespace-pre-wrap">{error}</p>
                      </div>
                      <button onClick={() => setError(null)} className="text-red-500 hover:opacity-70">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            {/* Plans Grid or Card Form */}
            <div className="px-6 md:px-10">
              {showCardForm ? (
                <div className="max-w-md mx-auto">
                  <div className="mb-8 text-center">
                    <h3 className="text-xl font-black text-app-text uppercase tracking-tight mb-2">Pagamento Seguro</h3>
                    <p className="text-xs text-app-muted font-bold">Assinando o Plano Mensal (R$ 5,99/mês)</p>
                  </div>
                  <CardForm 
                    amount={5.99} 
                    onSubmit={handleCardSubmit} 
                    isLoading={loadingPlan === 'monthly'} 
                  />
                  <p className="mt-6 text-[10px] text-app-muted font-bold text-center opacity-60 leading-relaxed uppercase tracking-widest">
                    Ambiente seguro e criptografado via Mercado Pago. <br/>
                    Cobrança mensal automática no cartão selecionado.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {plans.map((plan) => {
                    const isCurrentPlan = (plan.id === 'monthly' && currentPlan === 'premium' && !isLifetime) || 
                                        (plan.id === 'lifetime' && isLifetime);
                    const canUpgrade = (plan.id === 'lifetime' && currentPlan === 'premium' && !isLifetime) || 
                                      (currentPlan === 'free');

                    return (
                      <motion.div
                        key={plan.id}
                        className={cn(
                          "relative p-8 rounded-[40px] border transition-all overflow-hidden flex flex-col h-full",
                          plan.highlight 
                            ? "bg-app-card border-app-accent shadow-xl ring-2 ring-app-accent/20" 
                            : "bg-app-card border-app-border"
                        )}
                      >
                        {plan.highlight && (
                          <div className="absolute top-6 right-6 bg-app-accent text-app-accent-text text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                            Melhor Custo-Benefício
                          </div>
                        )}

                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-black text-app-text uppercase tracking-tight">{plan.name}</h3>
                            {isCurrentPlan && (
                              <span className="bg-emerald-500/10 text-emerald-500 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-emerald-500/20">
                                Ativo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-app-muted font-medium min-h-[32px] leading-snug">{plan.description}</p>
                        </div>

                        <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-4xl font-black text-app-text">{plan.price}</span>
                          <span className="text-sm text-app-accent font-bold uppercase tracking-widest">{plan.period}</span>
                        </div>

                        <div className="space-y-3 mb-8 flex-grow">
                          {plan.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-app-accent shrink-0" />
                              <span className="text-xs text-app-muted font-bold">{benefit}</span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <motion.button
                            disabled={loadingPlan !== null || isCurrentPlan || !canUpgrade || isPending}
                            whileHover={{ scale: (loadingPlan || isCurrentPlan || !canUpgrade || isPending) ? 1 : 1.02 }}
                            whileTap={{ scale: (loadingPlan || isCurrentPlan || !canUpgrade || isPending) ? 1 : 0.98 }}
                            onClick={() => handlePlanSelect(plan.id as any)}
                            className={cn(
                              "w-full py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
                              plan.highlight
                                ? "bg-app-accent text-app-accent-text shadow-xl shadow-app-accent/30"
                                : "bg-app-bg text-app-text border border-app-border hover:bg-app-border/20",
                              (loadingPlan || isCurrentPlan || !canUpgrade || isPending) && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {loadingPlan === plan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <span>{isCurrentPlan ? 'Plano Ativado' : isPending ? 'Aguardando Confirmação' : plan.id === 'monthly' ? 'Ver Opções de Cartão' : plan.cta}</span>
                                {!isCurrentPlan && !isPending && <ArrowRight className="w-4 h-4" />}
                                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                              </>
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

              {currentPlan === 'premium' && (
                <div className="mt-8 mx-10 p-4 bg-app-accent/5 border border-app-accent/10 rounded-3xl text-center">
                  <p className="text-[10px] font-black text-app-accent uppercase tracking-[0.2em]">
                    {isLifetime ? 'Você possui Acesso Vitalício!' : 'Você é Assinante Premium! Faça o upgrade para Vitalício e economize.'}
                  </p>
                </div>
              )}
            </>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

