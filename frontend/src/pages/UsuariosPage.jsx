import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import Button from '../components/ui/Button.jsx';
import DataState from '../components/ui/DataState.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import UsuarioFormModal from '../components/usuarios/UsuarioFormModal.jsx';
import { IconUserPlus, IconUsers, IconShield } from '../components/icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { listarUsuarios } from '../services/usuarios.service.js';
import { ROLES } from '../lib/constantes.js';
import { fechaHora, iniciales, tiempoRelativo } from '../lib/format.js';

const contarPorRol = (usuarios, rol) => usuarios.filter((u) => u.rol === rol).length;

export default function UsuariosPage() {
  const { usuario: usuarioActual } = useAuth();
  const toast = useToast();
  const { data, cargando, error, recargar } = useFetch(listarUsuarios, []);
  const [creando, setCreando] = useState(false);

  const usuarios = data ?? [];

  const columnas = [
    {
      clave: 'nombre',
      titulo: 'Usuario',
      render: (fila) => (
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
            {iniciales(fila.nombre)}
          </span>
          <span className="font-medium text-slate-900">{fila.nombre}</span>
          {fila.id === usuarioActual.id && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
              Tú
            </span>
          )}
        </div>
      ),
    },
    {
      clave: 'rol',
      titulo: 'Rol',
      render: (fila) =>
        fila.rol === ROLES.ADMINISTRADOR ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
            <IconShield className="h-3 w-3 text-brand-400" />
            Administrador
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            Empleado
          </span>
        ),
    },
    {
      clave: 'createdAt',
      titulo: 'Fecha de registro',
      render: (fila) => (
        <>
          <span className="text-slate-700">{fechaHora(fila.createdAt)}</span>
          <span className="ml-2 text-xs text-slate-400">({tiempoRelativo(fila.createdAt)})</span>
        </>
      ),
    },
  ];

  const alGuardar = (nuevoUsuario) => {
    setCreando(false);
    toast.exito(`Usuario "${nuevoUsuario.nombre}" registrado`);
    recargar();
  };

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Cuentas con acceso al sistema. Solo un administrador puede registrar nuevos empleados o administradores."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total de usuarios" value={usuarios.length} icon={IconUsers} index={0} />
        <StatCard
          label="Administradores"
          value={contarPorRol(usuarios, ROLES.ADMINISTRADOR)}
          icon={IconShield}
          accent="marca"
          index={1}
        />
        <StatCard
          label="Empleados"
          value={contarPorRol(usuarios, ROLES.EMPLEADO)}
          icon={IconUsers}
          accent="optimo"
          index={2}
        />
      </div>

      <Card
        title="Usuarios registrados"
        action={
          <Button size="sm" icon={IconUserPlus} onClick={() => setCreando(true)}>
            Nuevo usuario
          </Button>
        }
        bodyClassName="p-0"
      >
        <div className="p-4">
          <DataState
            cargando={cargando}
            error={error}
            onRetry={recargar}
            skeleton={<TableSkeleton columnas={3} />}
          >
            <DataTable columnas={columnas} filas={usuarios} vacio="No hay usuarios registrados." />
          </DataState>
        </div>
      </Card>

      {creando && <UsuarioFormModal open onClose={() => setCreando(false)} onSaved={alGuardar} />}
    </div>
  );
}
