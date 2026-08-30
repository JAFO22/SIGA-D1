import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Field from '../ui/Field.jsx';
import Alerta from '../ui/Alerta.jsx';
import Button from '../ui/Button.jsx';
import { crearProducto, actualizarProducto } from '../../services/productos.service.js';

function estadoInicial(producto) {
  return {
    nombre: producto?.nombre ?? '',
    categoria: producto?.categoria ?? '',
    proveedorId: producto?.proveedor?.id ?? producto?.proveedorId ?? '',
    stockActual: producto?.stockActual ?? 0,
  };
}

export default function ProductoFormModal({ open, producto, proveedores, onClose, onSaved }) {
  const editando = Boolean(producto);
  const [form, setForm] = useState(() => estadoInicial(producto));
  const [error, setError] = useState(null);
  const [detalles, setDetalles] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setDetalles(null);
    setGuardando(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim(),
        proveedorId: Number(form.proveedorId),
        stockActual: Number(form.stockActual),
      };
      if (editando) await actualizarProducto(producto.id, payload);
      else await crearProducto(payload);
      onSaved(editando ? 'Producto actualizado' : 'Producto creado');
    } catch (err) {
      setError(err.message);
      setDetalles(err.detalles ?? null);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal open={open} title={editando ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
      <form onSubmit={enviar} className="space-y-4">
        {error && (
          <Alerta tipo="error" detalles={detalles}>
            {error}
          </Alerta>
        )}

        <Field label="Nombre" name="nombre" value={form.nombre} onChange={cambiar} required autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría" name="categoria" value={form.categoria} onChange={cambiar} required />
          <Field
            label={editando ? 'Stock actual' : 'Stock inicial'}
            name="stockActual"
            type="number"
            min="0"
            step="1"
            value={form.stockActual}
            onChange={cambiar}
          />
        </div>
        <Field
          label="Proveedor"
          name="proveedorId"
          value={form.proveedorId}
          onChange={cambiar}
          required
          options={proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
        />

        <div className="flex justify-end gap-2 pt-1">
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
