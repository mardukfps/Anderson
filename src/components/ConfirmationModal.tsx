import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void; // This will now be "Secondary Action" (e.g. Discard)
  onStay?: () => void;   // This will be "Stay/Just Close"
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  onStay,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isDanger = false
}: ConfirmationModalProps) {
  const handleStay = onStay || onCancel;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleStay}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-app-card w-full max-w-sm rounded-[45px] overflow-hidden shadow-2xl pointer-events-auto border border-app-border transition-colors ring-1 ring-white/5"
            >
              <div className="p-8 text-left">
                <div className="flex justify-between items-start mb-6">
                  <motion.div 
                    initial={{ rotate: -10, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    className={`p-4 rounded-3xl ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-app-accent/10 text-app-accent'}`}
                  >
                    {isDanger ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Trash2 className="w-7 h-7" />
                      </motion.div>
                    ) : (
                      <AlertCircle className="w-7 h-7" />
                    )}
                  </motion.div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleStay} 
                    className="p-3 text-app-muted hover:bg-app-bg rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                
                <h3 className="text-2xl font-black text-app-text mb-3 tracking-tight">{title}</h3>
                <p className="text-sm font-medium text-app-muted leading-relaxed opacity-80">
                  {message}
                </p>
              </div>
              
              <div className="p-6 bg-app-bg/50 backdrop-blur-md flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onConfirm();
                  }}
                  className={`w-full py-5 px-4 font-black uppercase tracking-[0.2em] text-[10px] rounded-3xl shadow-xl transition-all ${
                    isDanger 
                      ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' 
                      : 'bg-app-accent text-app-accent-text shadow-xl shadow-app-accent/20'
                  }`}
                >
                  {confirmLabel}
                </motion.button>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCancel}
                    className="flex-1 py-4 px-4 bg-app-card border border-app-border text-app-text font-black uppercase tracking-[0.15em] text-[9px] rounded-2xl transition-all shadow-sm"
                  >
                    {cancelLabel}
                  </motion.button>
                  
                  {onStay && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onStay}
                      className="flex-1 py-4 px-4 bg-transparent text-app-muted font-black uppercase tracking-[0.15em] text-[9px] rounded-2xl transition-all"
                    >
                      Cancelar
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
