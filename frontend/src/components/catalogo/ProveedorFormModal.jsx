import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Field from '../ui/Field.jsx';
import Alerta from '../ui/Alerta.jsx';
import Button from '../ui/Button.jsx';
import { crearProveedor, actualizarProveedor } from '../../services/proveedores.service.js';

export default function ProveedorFormModal({ open, proveedor, onClose, onSaved }) {
  const editando = Boolean(proveedor);
  const [nombre, setNombre] = useState(proveedor?.nombre ?? '');
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      if (editando) await actualizarProveedor(proveedor.id, { nombre: nombre.trim() });
      else await crearProveedor({ nombre: nombre.trim() });
      onSaved(editando ? 'Proveedor actualizado' : 'Proveedor creado');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={open}
      title={editando ? 'Editar proveedor' : 'Nuevo proveedor'}
      description="El % de cumplimiento se calcula con los movimientos de entrada; no se edita aquí."
      onClose={onClose}
      width="max-w-md"
    >
      <form onSubmit={enviar} className="space-y-4">
        {error && <Alerta tipo="error">{error}</Alerta>}
        <Field label="Nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" cargando={guardando}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
