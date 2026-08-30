import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconCheck, IconAlert, IconClose } from '../icons.jsx';
import { cn } from '../../lib/cn.js';

const ToastContext = createContext(null);

const ESTILOS = {
  exito: { icon: IconCheck, ring: 'ring-emerald-600/20', chip: 'bg-emerald-50 text-risk-optimo' },
  error: { icon: IconAlert, ring: 'ring-rose-600/20', chip: 'bg-rose-50 text-risk-critico' },
  info: { icon: IconAlert, ring: 'ring-slate-600/15', chip: 'bg-slate-100 text-slate-500' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const quitar = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (tipo, mensaje, ttl = 4000) => {
      const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
      setToasts((t) => [...t, { id, tipo, mensaje }]);
      if (ttl) setTimeout(() => quitar(id), ttl);
    },
    [quitar],
  );

  const api = useMemo(
    () => ({
      exito: (m, ttl) => push('exito', m, ttl),
      error: (m, ttl) => push('error', m, ttl),
      info: (m, ttl) => push('info', m, ttl),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
        <AnimatePresence>
          {toasts.map((t) => {
            const s = ESTILOS[t.tipo] ?? ESTILOS.info;
            const Icon = s.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className={cn(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-pop ring-1 ring-inset',
                  s.ring,
                )}
              >
                <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg', s.chip)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <p className="flex-1 text-sm text-slate-700">{t.mensaje}</p>
                <button
                  type="button"
                  onClick={() => quitar(t.id)}
                  className="rounded p-0.5 text-slate-400 hover:text-slate-600"
                  aria-label="Cerrar"
                >
                  <IconClose className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
