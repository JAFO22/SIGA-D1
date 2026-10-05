import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import Button from '../components/ui/Button.jsx';
import DataState from '../components/ui/DataState.jsx';
import RiskBadge from '../components/ui/RiskBadge.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import ProductoFormModal from '../components/catalogo/ProductoFormModal.jsx';
import ProveedorFormModal from '../components/catalogo/ProveedorFormModal.jsx';
import { IconPlus, IconEdit, IconTrash } from '../components/icons.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { listarProductos, eliminarProducto } from '../services/productos.service.js';
import { listarProveedores, eliminarProveedor } from '../services/proveedores.service.js';
import { numero, porcentaje } from '../lib/format.js';
import { nivelConfiabilidad } from '../lib/constantes.js';

export default function CatalogoPage() {
  const toast = useToast();
  const productos = useFetch(listarProductos, []);
  const proveedores = useFetch(listarProveedores, []);

  const [dlgProducto, setDlgProducto] = useState(null);
  const [dlgProveedor, setDlgProveedor] = useState(null);

  const refrescar = () => {
    productos.recargar();
    proveedores.recargar();
  };

  const accionesFila = (onEdit, onDelete) => (
    <div className="flex justify-end gap-1">
      <button onClick={onEdit} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" title="Editar">
        <IconEdit className="h-4 w-4" />
      </button>
      <button onClick={onDelete} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-risk-critico" title="Eliminar">
        <IconTrash className="h-4 w-4" />
      </button>
    </div>
  );

  const colProductos = [
    { clave: 'nombre', titulo: 'Producto', render: (f) => <span className="font-medium text-slate-900">{f.nombre}</span> },
    { clave: 'categoria', titulo: 'Categoría', render: (f) => <span className="text-slate-500">{f.categoria}</span> },
    { clave: 'proveedor', titulo: 'Proveedor', render: (f) => f.proveedor?.nombre ?? '—' },
    { clave: 'stockActual', titulo: 'Stock', align: 'right', render: (f) => numero(f.stockActual) },
    {
      clave: 'acciones',
      titulo: '',
      align: 'right',
      render: (f) =>
        accionesFila(
          () => setDlgProducto({ modo: 'editar', item: f }),
          () => setDlgProducto({ modo: 'borrar', item: f }),
        ),
    },
  ];

  const colProveedores = [
    { clave: 'nombre', titulo: 'Proveedor', render: (f) => <span className="font-medium text-slate-900">{f.nombre}</span> },
    { clave: 'productos', titulo: 'Productos', align: 'right', render: (f) => numero(f._count?.productos ?? 0) },
    {
      clave: 'porcentajeCumplimiento',
      titulo: 'Cumplimiento',
      align: 'right',
      render: (f) => {
        const n = nivelConfiabilidad(f.porcentajeCumplimiento);
        return (
          <span className="inline-flex items-center gap-2">
            <span className="tnum font-medium text-slate-800">{porcentaje(f.porcentajeCumplimiento)}</span>
            <RiskBadge estado={n.clave} size="sm" />
          </span>
        );
      },
    },
    {
      clave: 'acciones',
      titulo: '',
      align: 'right',
      render: (f) =>
        accionesFila(
          () => setDlgProveedor({ modo: 'editar', item: f }),
          () => setDlgProveedor({ modo: 'borrar', item: f }),
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Catálogo" description="Administración de productos y proveedores. Disponible solo para el rol Administrador." />

      <div className="space-y-8">
        <Card
          title="Productos"
          action={
            <Button size="sm" icon={IconPlus} onClick={() => setDlgProducto({ modo: 'crear' })}>
              Nuevo producto
            </Button>
          }
          bodyClassName="p-0"
        >
          <div className="p-4">
            <DataState
              cargando={productos.cargando}
              error={productos.error}
              onRetry={productos.recargar}
              skeleton={<TableSkeleton columnas={5} />}
            >
              <DataTable columnas={colProductos} filas={productos.data ?? []} />
            </DataState>
          </div>
        </Card>

        <Card
          title="Proveedores"
          action={
            <Button size="sm" icon={IconPlus} onClick={() => setDlgProveedor({ modo: 'crear' })}>
              Nuevo proveedor
            </Button>
          }
          bodyClassName="p-0"
        >
          <div className="p-4">
            <DataState
              cargando={proveedores.cargando}
              error={proveedores.error}
              onRetry={proveedores.recargar}
              skeleton={<TableSkeleton columnas={4} />}
            >
              <DataTable columnas={colProveedores} filas={proveedores.data ?? []} />
            </DataState>
          </div>
        </Card>
      </div>

      {(dlgProducto?.modo === 'crear' || dlgProducto?.modo === 'editar') && (
        <ProductoFormModal
          open
          producto={dlgProducto.item}
          proveedores={proveedores.data ?? []}
          onClose={() => setDlgProducto(null)}
          onSaved={(msg) => {
            setDlgProducto(null);
            toast.exito(msg);
            productos.recargar();
          }}
        />
      )}
      <ConfirmDialog
        open={dlgProducto?.modo === 'borrar'}
        title="Eliminar producto"
        message={`¿Eliminar "${dlgProducto?.item?.nombre}"? Solo es posible si no tiene movimientos registrados.`}
        onClose={() => setDlgProducto(null)}
        onConfirm={async () => {
          await eliminarProducto(dlgProducto.item.id);
          setDlgProducto(null);
          toast.exito('Producto eliminado');
          productos.recargar();
        }}
      />

      {(dlgProveedor?.modo === 'crear' || dlgProveedor?.modo === 'editar') && (
        <ProveedorFormModal
          open
          proveedor={dlgProveedor.item}
          onClose={() => setDlgProveedor(null)}
          onSaved={(msg) => {
            setDlgProveedor(null);
            toast.exito(msg);
            refrescar();
          }}
        />
      )}
      <ConfirmDialog
        open={dlgProveedor?.modo === 'borrar'}
        title="Eliminar proveedor"
        message={`¿Eliminar "${dlgProveedor?.item?.nombre}"? Solo es posible si no tiene productos asociados.`}
        onClose={() => setDlgProveedor(null)}
        onConfirm={async () => {
          await eliminarProveedor(dlgProveedor.item.id);
          setDlgProveedor(null);
          toast.exito('Proveedor eliminado');
          refrescar();
        }}
      />
    </div>
  );
}
