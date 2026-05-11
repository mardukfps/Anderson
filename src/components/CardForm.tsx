import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

declare const MercadoPago: any;

interface CardFormProps {
  amount: number;
  onSubmit: (formData: any) => Promise<void>;
  isLoading: boolean;
}

export default function CardForm({ amount, onSubmit, isLoading }: CardFormProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cardBrickController: any = null;

    const initBrick = async () => {
      if (typeof MercadoPago === 'undefined') {
        setError('O SDK do Mercado Pago não foi carregado corretamente.');
        setIsInitializing(false);
        return;
      }

      const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
      if (!publicKey) {
        setError('VITE_MERCADO_PAGO_PUBLIC_KEY não configurada.');
        setIsInitializing(false);
        return;
      }

      try {
        const mp = new MercadoPago(publicKey);
        const bricksBuilder = mp.bricks();

        cardBrickController = await bricksBuilder.create(
          'cardPayment',
          'cardPaymentBrick_container',
          {
            initialization: {
              amount: amount,
            },
            customization: {
              paymentMethods: {
                minInstallments: 1,
                maxInstallments: 1,
              },
              visual: {
                style: {
                  theme: 'flat', // or 'default'
                  customVariables: {
                    borderRadius: '24px',
                    inputBackgroundColor: 'var(--color-app-card)',
                    baseColor: 'var(--color-app-accent)',
                  }
                }
              }
            },
            callbacks: {
              onReady: () => {
                setIsInitializing(false);
              },
              onSubmit: async (formData: any) => {
                try {
                  await onSubmit(formData);
                } catch (err: any) {
                  console.error('Submit error:', err);
                  throw err;
                }
              },
              onError: (error: any) => {
                console.error('Brick Error:', error);
                setError('Erro ao carregar o formulário de pagamento.');
                setIsInitializing(false);
              },
            },
          }
        );
      } catch (err) {
        console.error('Init error:', err);
        setError('Erro ao inicializar o processador de pagamentos.');
        setIsInitializing(false);
      }
    };

    initBrick();

    return () => {
      if (cardBrickController) {
        // Cleanup if necessary, though Bricks usually handles it or we re-render
      }
    };
  }, [amount]);

  return (
    <div className="space-y-4">
      {isInitializing && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-app-muted">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest">Inicializando Checkout...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold leading-snug">{error}</p>
        </div>
      )}

      <div id="cardPaymentBrick_container" className={isInitializing ? 'hidden' : ''}></div>
      
      {isLoading && !isInitializing && (
        <div className="absolute inset-0 bg-app-bg/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-[40px]">
          <div className="bg-app-card p-6 rounded-3xl shadow-xl border border-app-border flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-app-accent" />
            <p className="text-xs font-black uppercase tracking-widest text-app-text">Processando Assinatura...</p>
          </div>
        </div>
      )}
    </div>
  );
}
