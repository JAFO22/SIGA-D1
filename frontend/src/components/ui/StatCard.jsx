import CountUp from './CountUp.jsx';
import { cn } from '../../lib/cn.js';

const ACENTO = {
  neutro: { valor: 'text-slate-900', icono: 'bg-slate-100 text-slate-500' },
  critico: { valor: 'text-risk-critico', icono: 'bg-rose-50 text-risk-critico' },
  atencion: { valor: 'text-risk-atencion', icono: 'bg-amber-50 text-risk-atencion' },
  optimo: { valor: 'text-risk-optimo', icono: 'bg-emerald-50 text-risk-optimo' },
  marca: { valor: 'text-brand-600', icono: 'bg-brand-50 text-brand-600' },
};

/**
 * Tarjeta de indicador: número animado + etiqueta + icono.
 * `index` escalona la animación de entrada (CSS, siempre completa).
 */
export default function StatCard({ label, value, detail, icon: Icon, accent = 'neutro', index = 0, decimals = 0, format }) {
  const a = ACENTO[accent] ?? ACENTO.neutro;
  return (
    <div
      className="surface-pad animate-fade-in-up transition-shadow duration-200 hover:shadow-card-hover"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={cn('grid h-8 w-8 place-items-center rounded-lg', a.icono)}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className={cn('mt-2 text-[28px] font-semibold leading-none', a.valor)}>
        <CountUp value={value} decimals={decimals} format={format} />
      </p>
      {detail && <p className="mt-1.5 text-xs text-slate-400">{detail}</p>}
    </div>
  );
}
