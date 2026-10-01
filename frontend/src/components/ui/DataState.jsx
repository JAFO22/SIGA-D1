import Alerta from './Alerta.jsx';
import Button from './Button.jsx';

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
