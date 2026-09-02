import { useEffect, useState } from 'react';

/**
 * Anillo de progreso circular (0–100), para el % de cumplimiento del proveedor.
 * El trazo se rellena con una transición CSS al montar (fiable aunque el hilo
 * de animaciones JS esté pausado).
 */
export default function ProgressRing({ value = 0, size = 64, stroke = 6, color = '#059669', children }) {
  const radio = (size - stroke) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const acotado = Math.max(0, Math.min(100, value));

  const [offset, setOffset] = useState(circunferencia);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(circunferencia * (1 - acotado / 100)));
    const respaldo = setTimeout(() => setOffset(circunferencia * (1 - acotado / 100)), 250);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(respaldo);
    };
  }, [acotado, circunferencia]);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke="currentColor" className="text-slate-100" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .9s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
