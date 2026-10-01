import { useCallback, useEffect, useRef, useState } from 'react';

export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const peticionVigente = useRef(0);
  const montado = useRef(true);

  const ejecutar = useCallback(fetcher, deps);

  const recargar = useCallback(() => {
    const miPeticion = ++peticionVigente.current;
    const sigueSiendoLaUltima = () => montado.current && peticionVigente.current === miPeticion;

    setCargando(true);
    setError(null);

    return ejecutar()
      .then((resultado) => {
        if (sigueSiendoLaUltima()) setData(resultado);
      })
      .catch((fallo) => {
        if (sigueSiendoLaUltima()) setError(fallo.message || 'Error inesperado');
      })
      .finally(() => {
        if (sigueSiendoLaUltima()) setCargando(false);
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
