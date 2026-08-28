import { useEffect } from 'react';

/**
 * Emite eventos `resize` justo después de que cambie `dep`.
 *
 * El <ResponsiveContainer> de Recharts a veces se monta con ancho 0 cuando el
 * contenido aparece tras una carga asíncrona o un cambio de ruta del router y
 * no vuelve a medirse solo. Estos empujones (en el siguiente frame y un poco
 * después) lo obligan a recalcular su tamaño y dibujar la gráfica.
 */
export function useResizeNudge(dep) {
  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event('resize'));
    const raf = requestAnimationFrame(nudge);
    const t1 = setTimeout(nudge, 120);
    const t2 = setTimeout(nudge, 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [dep]);
}
