import { cn } from '../../lib/cn.js';

/**
 * Tabla de datos. Columnas:
 *   { clave, titulo, align?: 'right'|'center', render?(fila), className? }
 */
export default function DataTable({ columnas, filas, obtenerId = (f) => f.id, vacio = 'Sin registros.', onRowClick }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {columnas.map((col) => (
              <th
                key={col.clave}
                className={cn(
                  'whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  !col.align && 'text-left',
                )}
              >
                {col.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filas.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="px-4 py-10 text-center text-slate-400">
                {vacio}
              </td>
            </tr>
          ) : (
            filas.map((fila) => (
              <tr
                key={obtenerId(fila)}
                onClick={onRowClick ? () => onRowClick(fila) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/60',
                )}
              >
                {columnas.map((col) => (
                  <td
                    key={col.clave}
                    className={cn(
                      'px-4 py-3 text-slate-700',
                      col.align === 'right' && 'text-right tnum',
                      col.align === 'center' && 'text-center',
                      col.className,
                    )}
                  >
                    {col.render ? col.render(fila) : fila[col.clave]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
