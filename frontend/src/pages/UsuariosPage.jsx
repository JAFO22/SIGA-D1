import { useState, useMemo } from 'react';
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
import { listarUsuarios } from '../services/auth.service.js';
import { ROLES } from '../lib/constantes.js';
import { fechaHora, iniciales, tiempoRelativo } from '../lib/format.js';

export default function UsuariosPage() {
  const { usuario: usuarioActual } = useAuth();
  const toast = useToast();
  const usuariosFetch = useFetch(listarUsuarios, []);

  const [modalAbierto, setModalAbierto] = useState(false);

  const usuarios = usuariosFetch.data ?? [];

  const conteos = useMemo(() => {
    const total = usuarios.length;
    const administradores = usuarios.filter((u) => u.rol === ROLES.ADMINISTRADOR).length;
    const empleados = usuarios.filter((u) => u.rol === ROLES.EMPLEADO).length;
    return { total, administradores, empleados };
  }, [usuarios]);

  const columnas = [
    {
      clave: 'nombre',
      titulo: 'Usuario',
      render: (fila) => {
        const esUsuarioActual = fila.id === usuarioActual?.id;
        return (
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              {iniciales(fila.nombre)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">{fila.nombre}</span>
                {esUsuarioActual && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                    Tú
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">ID #{fila.id}</span>
            </div>
          </div>
        );
      },
    },
    {
      clave: 'rol',
      titulo: 'Rol',
      render: (fila) => {
        const esAdmin = fila.rol === ROLES.ADMINISTRADOR;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              esAdmin
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {esAdmin && <IconShield className="h-3 w-3 text-brand-400" />}
            {esAdmin ? 'Administrador' : 'Empleado'}
          </span>
        );
      },
    },
    {
      clave: 'createdAt',
      titulo: 'Fecha de registro',
      render: (fila) => (
        <div>
          <span className="text-slate-700">{fechaHora(fila.createdAt)}</span>
          <span className="ml-2 text-xs text-slate-400">({tiempoRelativo(fila.createdAt)})</span>
        </div>
      ),
    },
  ];

  const handleUsuarioGuardado = (nuevoUsuario) => {
    setModalAbierto(false);
    toast.exito(`Usuario "${nuevoUsuario.nombre}" registrado exitosamente.`);
    usuariosFetch.recargar();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        description="Administración de cuentas con acceso al sistema SIGA-D1. Puedes registrar nuevos operarios y administradores."
      />

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total de usuarios"
          value={conteos.total}
          icon={IconUsers}
          accent="neutro"
          index={0}
        />
        <StatCard
          label="Administradores"
          value={conteos.administradores}
          icon={IconShield}
          accent="marca"
          index={1}
        />
        <StatCard
          label="Empleados de tienda"
          value={conteos.empleados}
          icon={IconUsers}
          accent="optimo"
          index={2}
        />
      </div>

      {/* Lista de usuarios */}
      <Card
        title="Usuarios en el sistema"
        action={
          <Button
            size="sm"
            icon={IconUserPlus}
            onClick={() => setModalAbierto(true)}
          >
            Nuevo usuario
          </Button>
        }
        bodyClassName="p-0"
      >
        <div className="p-4">
          <DataState
            cargando={usuariosFetch.cargando}
            error={usuariosFetch.error}
            onRetry={usuariosFetch.recargar}
            skeleton={<TableSkeleton columnas={3} />}
          >
            <DataTable
              columnas={columnas}
              filas={usuarios}
              vacio="No se encontraron usuarios registrados."
            />
          </DataState>
        </div>
      </Card>

      {/* Modal de registro */}
      <UsuarioFormModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSaved={handleUsuarioGuardado}
      />
    </div>
  );
}
