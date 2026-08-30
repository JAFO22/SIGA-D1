import { cn } from '../../lib/cn.js';

/**
 * Campo de formulario con etiqueta y error. Soporta <input> y <select>
 * (pasando `options: [{ value, label }]`).
 */
export default function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  options,
  hint,
  required = false,
  className,
  ...rest
}) {
  const shared = {
    id: name,
    name,
    value,
    onChange,
    required,
    'aria-invalid': Boolean(error),
    className: cn('input', error && 'input-invalid', className),
  };

  return (
    <div>
      {label && (
        <label htmlFor={name} className="label">
          {label} {required && <span className="text-brand-500">*</span>}
        </label>
      )}
      {options ? (
        <select {...shared} {...rest}>
          <option value="">Seleccione…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input type={type} {...shared} {...rest} />
      )}
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}
