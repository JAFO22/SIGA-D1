import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn.js';

/**
 * Barra de progreso horizontal. Se anima con una transición CSS de `width` al
 * montar; un respaldo con setTimeout garantiza el ancho final aunque el
 * navegador tenga pausadas las animaciones por frame.
 *
 * `segments`: [{ value:0-100, className }]  — para barras apiladas.
 * `value` + `barClass`                      — para una sola barra.
 */
export default function MeterBar({ value, barClass, segments, trackClass = 'bg-slate-100', className }) {
  const partes = segments ?? [{ value, className: barClass }];
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setListo(true));
    const t = setTimeout(() => setListo(true), 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className={cn('flex h-2 overflow-hidden rounded-full', trackClass, className)}>
      {partes.map((p, i) => (
        <div
          key={i}
          className={cn('h-full', p.className)}
          style={{
            width: listo ? `${Math.max(0, Math.min(100, p.value))}%` : '0%',
            transition: 'width .7s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      ))}
    </div>
  );
}
