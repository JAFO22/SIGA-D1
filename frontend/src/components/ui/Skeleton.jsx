import { cn } from '../../lib/cn.js';

// Placeholder animado (efecto shimmer definido en index.css).
export function Skeleton({ className }) {
  return <span className={cn('skeleton block', className)} />;
}

// Skeleton con forma de tabla, para las vistas que cargan listados.
export function TableSkeleton({ filas = 6, columnas = 4 }) {
  return (
    <div className="surface overflow-hidden">
      <div className="flex gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3">
        {Array.from({ length: columnas }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: filas }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: columnas }).map((__, j) => (
              <Skeleton key={j} className={cn('h-4 flex-1', j === 0 && 'max-w-[40%]')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardsSkeleton({ n = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="surface-pad space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
