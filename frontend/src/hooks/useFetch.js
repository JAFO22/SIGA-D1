import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook minimo para cargar datos de la API con estado de carga/error y refetch.
 *
 *   const { data, cargando, error, recargar } = useFetch(() => servicio.listar(), []);
 *
 * `fetcher` debe ser estable o depender de `deps` (se memoiza internamente).
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const montado = useRef(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ejecutar = useCallback(fetcher, deps);

  const recargar = useCallback(() => {
    setCargando(true);
    setError(null);
    return ejecutar()
      .then((resultado) => {
        if (montado.current) setData(resultado);
      })
      .catch((e) => {
        if (montado.current) setError(e.message || 'Error inesperado');
      })
      .finally(() => {
        if (montado.current) setCargando(false);
      });
  }, [ejecutar]);

  useEffect(() => {
    montado.current = true;
    recargar();
    return () => {
      montado.current = false;
    };
  }, [recargar]);

  return { data, cargando, error, recargar, setData };
}
