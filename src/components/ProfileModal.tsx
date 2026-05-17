import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/cropImage';
import { 
  X, User as UserIcon, ShieldCheck, Mail, Camera, 
  Key, Save, Edit3, Trash2, Shield, Loader2, Eye, EyeOff,
  Lock, Check, Scissors
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  User, updatePassword, updateProfile, updateEmail,
  reauthenticateWithCredential, EmailAuthProvider 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess?: (message: string) => void;
  user: User;
}

export default function ProfileModal({ isOpen, onClose, onUpdateSuccess, user }: ProfileModalProps) {
  const { profile, updateUserName, updateUserPhoto, resendVerification, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(profile?.name || user.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || user.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Crop states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Sync state if profile loads while modal is open
  React.useEffect(() => {
    if (profile) {
      if (!name) setName(profile.name || user.displayName || '');
      if (!photoURL) setPhotoURL(profile.photoURL || user.photoURL || '');
    }
  }, [profile, user]);

  const compressImage = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension 400px (to keep under base64 limits easily)
        const maxDim = 400;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress with 0.5 quality and smaller dimension to be safe with all limits
        const compressed = canvas.toDataURL('image/jpeg', 0.5);
        resolve(compressed);
      };
      img.src = dataUrl;
    });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset input value to allow same file selection
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    try {
      setIsCropping(true);
      const croppedImageUrl = await getCroppedImg(
        selectedImage,
        croppedAreaPixels
      );
      
      setIsCompressing(true);
      const compressed = await compressImage(croppedImageUrl);
      setPhotoURL(compressed);
      
      // Cleanup
      setSelectedImage(null);
    } catch (err) {
      console.error('Crop/Compress error:', err);
      setError('Erro ao processar imagem');
    } finally {
      setIsCropping(false);
      setIsCompressing(false);
    }
  };

  const handleCropCancel = () => {
    setSelectedImage(null);
  };

  const handleSendResetEmail = async () => {
    if (!user.email) return;
    try {
      setIsSendingReset(true);
      setError(null);
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err: any) {
      console.error('Reset error:', err);
      setError('Erro ao enviar email de redefinição: ' + (err.message || String(err)));
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      setIsUpdating(true);
      
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuário não autenticado');

      // 1. Update Profile Name and Photo
      const nameChanged = name !== (profile?.name || user.displayName);
      const photoChanged = photoURL !== (profile?.photoURL || user.photoURL);
      const isPasswordChange = !!newPassword;

      if (isPasswordChange) {
        if (newPassword.length < 6) {
          throw new Error('A nova senha deve ter pelo menos 6 caracteres');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        
        const isPasswordProvider = user.providerData.some(p => p.providerId === 'password');
        if (isPasswordProvider) {
          if (!currentPassword) {
            setError('recent_login_required_with_form');
            setIsUpdating(false);
            return;
          }
          try {
            const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
          } catch (reauthErr: any) {
             if (reauthErr.code === 'auth/wrong-password' || reauthErr.code === 'auth/invalid-credential') {
              throw new Error('A senha atual está incorreta. Se esqueceu, use a opção de redefinir por e-mail.');
            }
            throw reauthErr;
          }
        }
      }

      if (nameChanged) {
        await updateUserName(name);
      }
      if (photoChanged) {
        await updateUserPhoto(photoURL);
      }

      if (isPasswordChange) {
        await updatePassword(currentUser, newPassword);
        const { apiService } = await import('../services/api');
        await apiService.updatePasswordAudit(currentUser.uid);
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      setSuccess(true);
      
      // Notify parent and auto-close after success
      setTimeout(() => {
        setSuccess(false);
        setPasswordSuccess(false);
        if (onUpdateSuccess) {
          onUpdateSuccess(isPasswordChange ? 'Senha alterada com sucesso!' : 'Perfil atualizado com sucesso!');
        }
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Update error:', err);
      
      const errorMessage = String(err.message || '').toLowerCase();
      const errorCode = String(err.code || '').toLowerCase();
      const errorString = String(err).toLowerCase();
      const errorJson = JSON.stringify(err).toLowerCase();
      
      const isRecentLoginError = 
        errorCode.includes('recent-login') || 
        errorMessage.includes('requires-recent-login') ||
        errorMessage.includes('recent-login') ||
        errorMessage.includes('recent login') ||
        errorString.includes('recent-login') ||
        errorString.includes('recent login') ||
        errorJson.includes('recent-login') ||
        errorJson.includes('requires-recent-login') ||
        (err.name === 'FirebaseError' && err.code === 'auth/requires-recent-login');
      
      if (isRecentLoginError) {
        setError('recent_login_required');
      } else {
        setError(err.message || String(err) || 'Erro ao atualizar perfil');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogoutAndRedirect = async () => {
    try {
      await logout();
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await resendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar e-mail');
    } finally {
      setResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-app-bg border border-app-border rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-app-border flex justify-between items-center bg-app-card/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-app-accent/10 text-app-accent">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-app-text uppercase italic">
                Configurações de Perfil
              </h2>
            </div>
            <button 
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl hover:bg-app-card text-app-muted hover:text-app-text transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleUpdate} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
            {/* Cropping Layer */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
                >
                  <div className="relative w-full max-w-lg aspect-square bg-app-card rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
                    <div className="flex-1 relative">
                      <Cropper
                        image={selectedImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        cropShape="round"
                        showGrid={false}
                      />
                    </div>
                    
                    <div className="p-6 space-y-6 bg-app-card border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase text-app-muted shrink-0">Zoom</span>
                        <input
                          type="range"
                          value={zoom}
                          min={1}
                          max={3}
                          step={0.1}
                          aria-labelledby="Zoom"
                          onChange={(e: any) => setZoom(e.target.value)}
                          className="flex-1 accent-app-accent h-1.5 bg-app-bg rounded-full appearance-none outline-none"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleCropCancel}
                          className="flex-1 py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleCropSave}
                          disabled={isCropping}
                          className="flex-[1.5] py-4 px-6 rounded-2xl bg-app-accent text-app-accent-text font-black uppercase tracking-widest text-[10px] shadow-lg shadow-app-accent/20 flex items-center justify-center gap-2"
                        >
                          {isCropping ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Scissors className="w-4 h-4" />
                              Recortar Foto
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center flex flex-col gap-3">
                {error === 'recent_login_required' ? (
                  <>
                    <span>Sua sessão expirou para esta alteração. Por favor, faça logout e login novamente.</span>
                    <button 
                      type="button" 
                      onClick={handleLogoutAndRedirect}
                      className="py-2 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                    >
                      Sair Agora
                    </button>
                  </>
                ) : error === 'recent_login_required_with_form' ? (
                  <>
                    <span className="text-amber-500">Confirme sua senha atual para alterar para uma nova.</span>
                  </>
                ) : (
                  error
                )}
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-[10px] font-black uppercase tracking-widest text-center">
                Perfil atualizado com sucesso!
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-[10px] font-black uppercase tracking-widest text-center">
                Senha alterada com sucesso!
              </div>
            )}

            {/* Photo Section */}
            <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className={cn(
                    "w-24 h-24 rounded-3xl bg-app-card border-2 border-app-border overflow-hidden flex items-center justify-center shadow-inner",
                    isCompressing && "animate-pulse"
                  )}>
                    {isCompressing ? (
                      <Loader2 className="w-10 h-10 text-app-accent animate-spin" />
                    ) : photoURL ? (
                      <img src={photoURL} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-app-muted/30" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    type="button"
                    onClick={handlePhotoClick}
                    disabled={isCompressing}
                    className="absolute -bottom-2 -right-2 p-3 bg-app-accent text-app-accent-text rounded-2xl shadow-xl hover:scale-105 transition-transform border-4 border-app-bg disabled:opacity-50"
                    title="Alterar foto"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest opacity-60">Foto de Perfil</p>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
                  <UserIcon className="w-3 h-3" /> Nome Completo
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-app-card border border-app-border p-4 rounded-2xl focus:ring-2 focus:ring-app-accent/10 transition-all outline-none font-bold text-app-text"
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3 h-3" /> E-mail
                </label>
                <div className="w-full bg-app-bg/50 border border-app-border p-4 rounded-2xl font-bold text-app-muted/40 flex items-center gap-3">
                  <span className="flex-1 truncate">{user.email}</span>
                  {user.emailVerified ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <button 
                      type="button"
                      onClick={handleResend}
                      disabled={resending || resent}
                      className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-all"
                    >
                      {resent ? "Enviado" : resending ? "..." : "Verificar"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Password section */}
            {user.providerData.some(p => p.providerId === 'password') && (
              <div className="space-y-4 pt-4 border-t border-app-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-app-text uppercase tracking-[0.2em] opacity-40">Segurança</h3>
                  <div className="flex items-center gap-1 text-[8px] font-bold text-app-muted uppercase tracking-widest text-amber-500">
                    <Key className="w-2.5 h-2.5" /> Mudar Senha
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2 text-amber-500">
                       <Lock className="w-3 h-3" /> Senha Atual
                    </label>
                    <button
                      type="button"
                      onClick={handleSendResetEmail}
                      disabled={isSendingReset}
                      className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-colors border",
                        resetSent 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : "bg-app-accent/5 text-app-accent border-app-accent/10 hover:bg-app-accent/10"
                      )}
                    >
                      {resetSent ? "Email Enviado!" : isSendingReset ? "Enviando..." : "Esqueceu a senha?"}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showCurrentPassword ? "text" : "password"} 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-app-card border border-app-border p-4 pr-12 rounded-2xl focus:ring-2 focus:ring-amber-500/10 transition-all outline-none font-bold text-app-text"
                      placeholder="Sua senha atual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
                     Nova Senha
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-app-card border border-app-border p-4 pr-12 rounded-2xl focus:ring-2 focus:ring-app-accent/10 transition-all outline-none font-bold text-app-text"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
                     Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-app-card border border-app-border p-4 pr-12 rounded-2xl focus:ring-2 focus:ring-app-accent/10 transition-all outline-none font-bold text-app-text"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isUpdating}
            className={cn(
              "w-full py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all",
              success ? "bg-emerald-500 text-white" : "bg-app-accent text-app-accent-text hover:shadow-app-accent/20"
            )}
          >
            {success ? (
              <>Perfil Atualizado!</>
            ) : isUpdating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Alterações
              </>
            )}
          </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
