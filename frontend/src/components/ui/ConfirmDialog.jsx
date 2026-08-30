import { useState } from 'react';
import Modal from './Modal.jsx';
import Alerta from './Alerta.jsx';
import Button from './Button.jsx';

/**
 * Confirmación para acciones destructivas. `onConfirm` puede devolver una
 * promesa; si lanza, el error se muestra dentro del diálogo.
 */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', onConfirm, onClose }) {
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const confirmar = async () => {
    setError(null);
    setProcesando(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={onClose} width="max-w-md">
      <div className="space-y-4">
        {error && <Alerta tipo="error">{error}</Alerta>}
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" cargando={procesando} onClick={confirmar}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
