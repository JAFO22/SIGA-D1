import { cn } from '../../lib/cn.js';

const VARIANTES = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  subtle: 'btn-subtle',
  danger: 'btn-danger',
};

export default function Button({
  variant = 'primary',
  size,
  cargando = false,
  disabled,
  icon: Icon,
  children,
  className,
  ...rest
}) {
  return (
    <button
      className={cn(VARIANTES[variant], size === 'sm' && 'btn-sm', className)}
      disabled={disabled || cargando}
      {...rest}
    >
      {cargando ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </button>
  );
}
