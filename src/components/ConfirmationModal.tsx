import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  isDanger?: boolean;
}

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmLabel = "Confirmar",
  isDanger = false
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-app-card w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl pointer-events-auto border border-app-border transition-colors ring-1 ring-white/5"
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
                    onClick={onCancel} 
                    className="p-3 text-app-muted hover:bg-app-bg rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                
                <h3 className="text-2xl font-bold text-app-text mb-3 tracking-tight">{title}</h3>
                <p className="text-base text-app-muted leading-relaxed opacity-80">
                  {message}
                </p>
              </div>
              
              <div className="p-6 bg-app-bg/50 backdrop-blur-md flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "var(--app-card)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  className="flex-1 py-5 px-4 bg-app-card border border-app-border text-app-muted font-bold uppercase tracking-widest text-[10px] rounded-3xl transition-all shadow-sm"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onConfirm();
                  }}
                  className={`flex-1 py-5 px-4 font-bold uppercase tracking-widest text-[10px] rounded-3xl shadow-xl transition-all ${
                    isDanger 
                      ? 'bg-red-500 text-white shadow-red-500/20' 
                      : 'bg-app-accent text-app-accent-text shadow-app-accent/20'
                  }`}
                >
                  {confirmLabel}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
