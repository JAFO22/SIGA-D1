import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Field from '../ui/Field.jsx';
import Alerta from '../ui/Alerta.jsx';
import Button from '../ui/Button.jsx';
import { ROLES } from '../../lib/constantes.js';
import { crearUsuario } from '../../services/usuarios.service.js';

const OPCIONES_DE_ROL = [
  { value: ROLES.EMPLEADO, label: 'Empleado (operario de tienda)' },
  { value: ROLES.ADMINISTRADOR, label: 'Administrador (acceso total)' },
];

export default function UsuarioFormModal({ open, onClose, onSaved }) {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(ROLES.EMPLEADO);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const usuario = await crearUsuario({ nombre: nombre.trim(), password, rol });
      onSaved(usuario);
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Nuevo usuario"
      description="Crea una cuenta para un empleado u otro administrador de la tienda."
      onClose={onClose}
      width="max-w-md"
    >
      <form onSubmit={enviar} className="space-y-4">
        {error && (
          <Alerta tipo="error" detalles={error.detalles}>
            {error.message}
          </Alerta>
        )}

        <Field
          label="Nombre de usuario"
          name="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="ej. julian.gomez"
          hint="Entre 3 y 30 caracteres."
          minLength={3}
          maxLength={30}
          autoComplete="off"
          required
          autoFocus
        />

        <Field
          label="Contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Mínimo 6 caracteres."
          minLength={6}
          autoComplete="new-password"
          required
        />

        <Field
          label="Rol en el sistema"
          name="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          options={OPCIONES_DE_ROL}
          hint="Define las pantallas y acciones permitidas para este usuario."
          required
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" cargando={guardando}>
            Registrar usuario
          </Button>
        </div>
      </form>
    </Modal>
  );
}
