const fmtNumero = new Intl.NumberFormat('es-CO');
const fmtDecimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

export function numero(valor) {
  return fmtNumero.format(Math.round(valor ?? 0));
}

export function decimal(valor) {
  if (valor === null || valor === undefined) return '—';
  return fmtDecimal.format(valor);
}

export function porcentaje(valor, decimales = 1) {
  if (valor === null || valor === undefined) return '—';
  return `${valor.toLocaleString('es-CO', { maximumFractionDigits: decimales })}%`;
}

export function dias(valor) {
  if (valor === null || valor === undefined) return 'Sin ventas recientes';
  if (valor === 0) return 'Agotado';
  const n = fmtDecimal.format(valor);
  return `${n} ${valor === 1 ? 'día' : 'días'}`;
}

export function fechaHora(valor) {
  return new Date(valor).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fechaCorta(valor) {
  return new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

export function tiempoRelativo(valor) {
  const diff = Date.now() - new Date(valor).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

export function iniciales(nombre = '') {
  return nombre.trim().slice(0, 2).toUpperCase() || '?';
}
