import { cn } from '../../lib/cn.js';

export default function Card({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  hover = false,
}) {
  return (
    <section
      className={cn(
        'surface overflow-hidden',
        hover && 'transition-shadow duration-200 hover:shadow-card-hover',
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('p-5 sm:p-6', bodyClassName)}>{children}</div>
    </section>
  );
}
