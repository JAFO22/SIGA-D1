import { motion } from 'framer-motion';
import { cn } from '../../lib/cn.js';

export default function Segmented({ options, value, onChange, name = 'seg' }) {
  return (
    <div className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-100 p-1">
      {options.map((o) => {
        const activo = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              activo ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {activo && (
              <motion.span
                layoutId={`seg-${name}`}
                className="absolute inset-0 rounded-md bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {o.icon && <o.icon className="h-4 w-4" />}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
