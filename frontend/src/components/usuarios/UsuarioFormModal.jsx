import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Field from '../ui/Field.jsx';
import Alerta from '../ui/Alerta.jsx';
import Button from '../ui/Button.jsx';
import { ROLES } from '../../lib/constantes.js';
import { registrarUsuario } from '../../services/auth.service.js';

const OPCIONES_ROL = [
  { value: ROLES.EMPLEADO, label: 'Empleado (Operario de tienda)' },
  { value: ROLES.ADMINISTRADOR, label: 'Administrador (Acceso total)' },
];

export default function UsuarioFormModal({ open, onClose, onSaved }) {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(ROLES.EMPLEADO);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const resetear = () => {
    setNombre('');
    setPassword('');
    setRol(ROLES.EMPLEADO);
    setError(null);
  };

  const handleCerrar = () => {
    resetear();
    onClose();
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);

    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al minímo 6 caracteres.');
      return;
    }

    setGuardando(true);
    try {
      const nuevoUsuario = await registrarUsuario({
        nombre: nombreLimpio,
        password,
        rol,
      });
      resetear();
      onSaved(nuevoUsuario);
    } catch (err) {
      setError(err.message || 'No fue posible registrar el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Nuevo usuario"
      description="Crea una cuenta para un empleado u otro administrador de la tienda."
      onClose={handleCerrar}
      width="max-w-md"
    >
      <form onSubmit={enviar} className="space-y-4">
        {error && <Alerta tipo="error">{error}</Alerta>}

        <Field
          label="Nombre de usuario"
          name="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="ej. julian.gomez"
          hint="Entre 3 y 30 caracteres. Sin espacios al inicio o final."
          required
          autoFocus
        />

        <Field
          label="Contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          hint="Mínimo 6 caracteres."
          required
        />

        <Field
          label="Rol en el sistema"
          name="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          options={OPCIONES_ROL}
          hint="Define las pantallas y acciones permitidas para este usuario."
          required
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleCerrar} disabled={guardando}>
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
