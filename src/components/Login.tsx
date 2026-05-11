import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { Chrome, AlertCircle, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from './Logo';

type AuthMode = 'login' | 'signup';

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar com Google');
    } finally {
      setIsLoading(false);
    }
  };

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
              O provedor de E-mail/Senha precisa ser habilitado no Firebase Console.
            </p>
            <ol className="text-[9px] list-decimal ml-4 opacity-90">
              <li>Acesse <a href="https://console.firebase.google.com/project/gen-lang-client-0519991270/authentication/providers" target="_blank" rel="noreferrer" className="underline font-bold">Autenticação</a></li>
              <li>Habilite "E-mail/Senha"</li>
              <li>Salve e tente novamente</li>
            </ol>
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
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-app-accent/10 via-transparent to-transparent">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-app-card p-10 rounded-3xl shadow-2xl border border-app-border backdrop-blur-sm text-center"
      >
        <div className="mb-10 flex flex-col items-center">
          <Logo size={100} className="mb-6" />
          <div className="flex flex-col items-center">
            <span className="text-app-muted text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Bem-vindo ao</span>
            <h1 className="text-2xl font-black tracking-[0.1em] uppercase text-app-text">
              JORNADA<span className="text-app-accent">+</span>
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          {authMode === 'login' && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-app-accent text-app-accent-text flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-app-accent/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Chrome className="w-5 h-5" />
                    <span>Entrar com Google</span>
                  </>
                )}
              </motion.button>

              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-app-border"></div>
                </div>
                <span className="relative px-3 bg-app-card text-[8px] font-black uppercase text-app-muted tracking-[0.3em]">Ou e-mail</span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, x: authMode === 'login' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: authMode === 'login' ? 10 : -10 }}
                className="space-y-4 text-left"
              >
                {authMode === 'signup' && (
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-app-accent transition-colors">
                      <User className="w-5 h-5" />
                    </div>
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

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-app-accent transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-app-bg border border-app-border focus:border-app-accent rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-app-accent transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    placeholder={authMode === 'signup' ? "Mínimo 8 caracteres" : "Senha"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-app-bg border border-app-border focus:border-app-accent rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-app-bg border border-app-border text-app-text flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all hover:bg-app-border/20 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{authMode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setError(null);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-app-accent hover:opacity-80 transition-opacity"
                  >
                    {authMode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 items-start"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="text-[10px] text-red-500 text-left leading-tight">
                  {typeof error === 'string' ? <span className="font-bold uppercase tracking-widest">{error}</span> : error}
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 items-start"
              >
                <div className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-black">!</span>
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 text-left leading-tight">
                  <span className="font-bold uppercase tracking-widest">{success}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 pt-8 border-t border-app-border space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-40">
            <div className="h-px w-8 bg-app-border" />
            <p className="text-[8px] font-black text-app-muted uppercase tracking-[0.2em]">
              Jornada+ &copy; 2026
            </p>
            <div className="h-px w-8 bg-app-border" />
          </div>
          <p className="text-[10px] font-bold text-app-accent uppercase tracking-widest">
            Desenvolvido por Anderson Silva
          </p>
        </div>
      </motion.div>
    </div>
  );
}
