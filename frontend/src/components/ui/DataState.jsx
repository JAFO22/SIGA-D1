import Alerta from './Alerta.jsx';
import Button from './Button.jsx';

/**
 * Orquesta los estados de una vista con datos remotos.
 * `skeleton` es el placeholder a mostrar mientras carga (si se omite, no muestra nada).
 */
export default function DataState({ cargando, error, empty, emptyNode, skeleton, onRetry, children }) {
  if (cargando) return skeleton ?? null;

  if (error) {
    return (
      <div className="space-y-3">
        <Alerta tipo="error">{error}</Alerta>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  if (empty) return emptyNode ?? null;

  return children;
}
