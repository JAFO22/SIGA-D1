import { useEffect, useState } from 'react';

/**
 * Anima un número de 0 a `value` con una curva easeOut.
 *
 * Robustez: si `requestAnimationFrame` no corre (pestaña en segundo plano),
 * un `setTimeout` de respaldo fija el valor final para que nunca quede a medias.
 */
export default function CountUp({ value = 0, duration = 900, decimals = 0, format }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    let raf;
    let terminado = false;
    const inicio = performance.now();

    const paso = (ahora) => {
      const p = Math.min(1, (ahora - inicio) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(paso);
      else terminado = true;
    };

    setDisplay(0);
    raf = requestAnimationFrame(paso);
    const respaldo = setTimeout(() => {
      if (!terminado) setDisplay(value);
    }, duration + 400);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(respaldo);
    };
  }, [value, duration]);

  const n = decimals > 0 ? Number(display.toFixed(decimals)) : Math.round(display);
  return <span className="tnum">{format ? format(n) : n.toLocaleString('es-CO')}</span>;
}
