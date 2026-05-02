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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-dark-card w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto border dark:border-white/5 transition-colors"
            >
              <div className="p-6 text-left">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${isDanger ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400'}`}>
                    {isDanger ? <Trash2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </div>
                  <button onClick={onCancel} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {message}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-black/20 flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-4 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onCancel();
                  }}
                  className={`flex-1 py-4 px-4 font-bold uppercase tracking-widest text-xs rounded-2xl shadow-lg transition-all active:scale-95 ${
                    isDanger 
                      ? 'bg-red-500 text-white shadow-red-200 dark:shadow-none' 
                      : 'bg-[#141414] dark:bg-white text-white dark:text-black shadow-gray-200 dark:shadow-none'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
