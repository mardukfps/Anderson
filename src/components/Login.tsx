import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { Chrome, AlertCircle, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from './Logo';

type AuthMode = 'login' | 'signup';

export default function Login() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validatePassword = (pass: string) => {
    if (authMode === 'signup' && pass.length < 8) return 'A senha deve ter no mínimo 8 caracteres';
    if (!pass) return 'A senha é obrigatória';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmail(email, password);
      } else {
        if (!name) {
          setError('O nome é obrigatório para o cadastro');
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, name);
        setSuccess('E-mail de verificação enviado! Verifique sua caixa de entrada.');
        setAuthMode('login');
      }
    } catch (err: any) {
      let errorMsg: React.ReactNode = 'Ocorreu um erro ao processar sua solicitação';
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/user-not-found' || 
          code === 'auth/wrong-password' || 
          code === 'auth/invalid-credential' ||
          message.includes('auth/invalid-credential')) {
        errorMsg = 'E-mail ou senha incorretos';
      } else if (code === 'auth/operation-not-allowed') {
        errorMsg = (
          <div className="flex flex-col gap-2 text-left p-2">
            <span className="font-bold">E-mail/Senha não ativado</span>
            <p className="text-[9px] opacity-90">
              O provedor de E-mail/Senha precisa ser habilitado no Console.
            </p>
          </div>
        );
      } else if (err.code === 'auth/email-already-in-use') {
        errorMsg = (
          <div className="flex flex-col gap-2">
            <span>Este e-mail já está em uso</span>
            <button 
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className="text-[9px] underline font-black uppercase tracking-widest text-app-accent hover:opacity-80"
            >
              Tentar fazer login
            </button>
          </div>
        );
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'E-mail inválido';
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-app-card p-10 rounded-3xl shadow-xl border border-app-border"
      >
        <div className="mb-10 flex flex-col items-center">
          <Logo size={80} className="mb-6" />
          <h1 className="text-2xl font-bold tracking-tight text-app-text">
            JORNADA<span className="text-app-accent">+</span>
          </h1>
          <p className="text-app-muted text-xs font-medium mt-1">Sua gestão de horas extras</p>
        </div>

        <div className="space-y-6">
          <div className="flex bg-app-bg p-1 rounded-2xl border border-app-border">
            <button
              onClick={() => setAuthMode('login')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all",
                authMode === 'login' ? "bg-app-card shadow-sm text-app-text" : "text-app-muted"
              )}
            >
              Fazer Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all",
                authMode === 'signup' ? "bg-app-card shadow-sm text-app-text" : "text-app-muted"
              )}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-4"
              >
                {authMode === 'signup' && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted" />
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-app-bg border border-app-border focus:border-app-accent rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted" />
                  <input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-app-bg border border-app-border focus:border-app-accent rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted" />
                  <input
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-app-bg border border-app-border focus:border-app-accent rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all"
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-app-accent border border-app-accent text-app-accent-text flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-app-accent/20 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Acessar Conta' : 'Começar Agora'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 items-center"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <div className="text-xs text-red-500 font-medium">
                  {error}
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 items-center"
              >
                <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Logo size={10} />
                </div>
                <div className="text-xs text-emerald-500 font-medium">
                  {success}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

