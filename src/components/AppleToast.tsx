import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface AppleToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export function AppleToast({ message, type = 'success' }: AppleToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.92, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -16, scale: 0.94, filter: 'blur(6px)' }}
          transition={{ type: 'spring', damping: 26, stiffness: 380 }}
          className="fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 bg-zinc-900/90 backdrop-blur-2xl border border-white/15 text-white text-xs font-semibold rounded-2xl shadow-2xl shadow-black/80 max-w-sm pointer-events-none"
        >
          <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            {type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            ) : type === 'info' ? (
              <Info className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <span className="leading-snug">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
