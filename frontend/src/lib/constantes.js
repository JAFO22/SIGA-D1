export const ROLES = {
  EMPLEADO: 'EMPLEADO',
  ADMINISTRADOR: 'ADMINISTRADOR',
};

export const TIPO_MOVIMIENTO = {
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA',
};

export const RIESGO_META = {
  ROJO: {
    nivel: 'Crítico',
    detalle: 'Quiebre inminente',
    prioridad: 0,
    color: '#e11d48',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    soft: 'bg-rose-50 text-rose-700 ring-rose-600/15',
    bar: 'bg-rose-500',
    track: 'bg-rose-100',
  },
  AMARILLO: {
    nivel: 'Atención',
    detalle: 'Reposición prioritaria',
    prioridad: 1,
    color: '#d97706',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    soft: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    bar: 'bg-amber-500',
    track: 'bg-amber-100',
  },
  VERDE: {
    nivel: 'Óptimo',
    detalle: 'Cobertura estable',
    prioridad: 2,
    color: '#059669',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    bar: 'bg-emerald-500',
    track: 'bg-emerald-100',
  },
};

export function nivelConfiabilidad(pct) {
  if (pct >= 95) return { clave: 'VERDE', etiqueta: 'Confiable' };
  if (pct >= 85) return { clave: 'AMARILLO', etiqueta: 'Aceptable' };
  return { clave: 'ROJO', etiqueta: 'En observación' };
}
