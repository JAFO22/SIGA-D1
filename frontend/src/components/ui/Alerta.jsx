import { IconAlert } from '../icons.jsx';
import { cn } from '../../lib/cn.js';

const ESTILOS = {
  error: 'bg-rose-50 text-rose-800 ring-rose-600/15',
  info: 'bg-slate-50 text-slate-700 ring-slate-600/10',
  exito: 'bg-emerald-50 text-emerald-800 ring-emerald-600/15',
  aviso: 'bg-amber-50 text-amber-800 ring-amber-600/15',
};

// Aviso en línea (para formularios). Los mensajes efímeros de éxito usan toasts.
export default function Alerta({ tipo = 'info', children, detalles }) {
  return (
    <div className={cn('flex gap-2.5 rounded-lg px-3.5 py-3 text-sm ring-1 ring-inset', ESTILOS[tipo])}>
      <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p>{children}</p>
        {Array.isArray(detalles) && detalles.length > 0 && (
          <ul className="mt-1 list-inside list-disc text-xs opacity-90">
            {detalles.map((d, i) => (
              <li key={i}>
                {d.campo ? `${d.campo}: ` : ''}
                {d.mensaje}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
