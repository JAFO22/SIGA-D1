import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Field from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import DataState from '../components/ui/DataState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { listarProductos } from '../services/productos.service.js';
import { listarMovimientos, registrarMovimiento } from '../services/movimientos.service.js';
import { TIPO_MOVIMIENTO } from '../lib/constantes.js';
import { numero, fechaHora } from '../lib/format.js';
import { IconArrowDown, IconArrowUp, IconMovements } from '../components/icons.jsx';
import { cn } from '../lib/cn.js';

const FORM_INICIAL = { productoId: '', tipo: 'SALIDA', cantidad: '', cantidadSolicitada: '' };

export default function MovimientosPage() {
  const toast = useToast();
  const { data: productos, recargar: recargarProductos } = useFetch(listarProductos, []);
  const { data: movimientos, cargando, error, recargar } = useFetch(
    () => listarMovimientos({ limite: 30 }),
    [],
  );

  const [form, setForm] = useState(FORM_INICIAL);
  const [errForm, setErrForm] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const esEntrada = form.tipo === TIPO_MOVIMIENTO.ENTRADA;
  const cambiar = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setErrForm(null);
    setEnviando(true);
    try {
      const payload = {
        productoId: Number(form.productoId),
        tipo: form.tipo,
        cantidad: Number(form.cantidad),
      };
      if (esEntrada && form.cantidadSolicitada !== '') {
        payload.cantidadSolicitada = Number(form.cantidadSolicitada);
      }
      const creado = await registrarMovimiento(payload);
      toast.exito(
        `${creado.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} de ${numero(creado.cantidad)} u · ${creado.producto.nombre}`,
      );
      setForm((f) => ({ ...FORM_INICIAL, productoId: f.productoId, tipo: f.tipo }));
      recargar();
      recargarProductos();
    } catch (err) {
      setErrForm({ msg: err.message, detalles: err.detalles });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Movimientos"
        description="Cada entrada o salida actualiza el inventario y alimenta el riesgo de quiebre y la confiabilidad del proveedor."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card title="Registrar movimiento">
          <form onSubmit={enviar} className="space-y-4">
            {errForm && (
              <Alerta tipo="error" detalles={errForm.detalles}>
                {errForm.msg}
              </Alerta>
            )}

            <div>
              <span className="label">Tipo</span>
              <Segmented
                name="tipo-mov"
                value={form.tipo}
                onChange={(v) => setForm((f) => ({ ...f, tipo: v }))}
                options={[
                  { value: 'SALIDA', label: 'Salida', icon: IconArrowDown },
                  { value: 'ENTRADA', label: 'Entrada', icon: IconArrowUp },
                ]}
              />
            </div>

            <Field
              label="Producto"
              name="productoId"
              value={form.productoId}
              onChange={cambiar}
              required
              options={(productos ?? []).map((p) => ({
                value: p.id,
                label: `${p.nombre} · stock ${p.stockActual}`,
              }))}
            />

            <Field
              label={esEntrada ? 'Unidades recibidas' : 'Unidades vendidas'}
              name="cantidad"
              type="number"
              min="1"
              step="1"
              value={form.cantidad}
              onChange={cambiar}
              required
            />

            {esEntrada && (
              <Field
                label="Unidades solicitadas al proveedor"
                name="cantidadSolicitada"
                type="number"
                min="1"
                step="1"
                value={form.cantidadSolicitada}
                onChange={cambiar}
                hint="Opcional. Permite calcular el cumplimiento del proveedor."
              />
            )}

            <Button type="submit" cargando={enviando} className="w-full">
              {enviando ? 'Registrando…' : 'Registrar movimiento'}
            </Button>
          </form>
        </Card>

        <Card title="Actividad reciente" subtitle="Últimos 30 movimientos" bodyClassName="p-0">
          <DataState
            cargando={cargando}
            error={error}
            empty={(movimientos ?? []).length === 0}
            emptyNode={
              <div className="p-6">
                <EmptyState icon={IconMovements} title="Aún no hay movimientos" />
              </div>
            }
            onRetry={recargar}
            skeleton={
              <div className="p-4">
                <TableSkeleton columnas={4} />
              </div>
            }
          >
            <ul className="divide-y divide-slate-100">
              {(movimientos ?? []).map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                      m.tipo === 'ENTRADA' ? 'bg-emerald-50 text-risk-optimo' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {m.tipo === 'ENTRADA' ? <IconArrowUp className="h-4 w-4" /> : <IconArrowDown className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{m.producto?.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {fechaHora(m.fecha)} · {m.usuario?.nombre}
                    </p>
                  </div>
                  {m.cantidadSolicitada != null && (
                    <span className="hidden text-xs text-slate-400 sm:block">
                      pedido {numero(m.cantidadSolicitada)}
                    </span>
                  )}
                  <span
                    className={cn(
                      'tnum text-sm font-semibold',
                      m.tipo === 'ENTRADA' ? 'text-risk-optimo' : 'text-slate-700',
                    )}
                  >
                    {m.tipo === 'ENTRADA' ? '+' : '−'}
                    {numero(m.cantidad)}
                  </span>
                </li>
              ))}
            </ul>
          </DataState>
        </Card>
      </div>
    </div>
  );
}
