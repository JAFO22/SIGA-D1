import { useEffect } from 'react';

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
