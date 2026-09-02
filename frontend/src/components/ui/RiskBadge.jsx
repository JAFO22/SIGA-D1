import { RIESGO_META } from '../../lib/constantes.js';
import { cn } from '../../lib/cn.js';

/**
 * Insignia de nivel de riesgo de quiebre.
 * `size`: 'sm' | 'md'. `withDetail` muestra la descripción en vez del nivel.
 */
export default function RiskBadge({ estado, size = 'md', withDetail = false }) {
  const meta = RIESGO_META[estado] ?? RIESGO_META.VERDE;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        meta.soft,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      )}
      title={meta.detalle}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {withDetail ? meta.detalle : meta.nivel}
    </span>
  );
}
