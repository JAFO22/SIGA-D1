import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import DataState from '../components/ui/DataState.jsx';
import ProgressRing from '../components/ui/ProgressRing.jsx';
import Sparkline from '../components/ui/Sparkline.jsx';
import RiskBadge from '../components/ui/RiskBadge.jsx';
import ChartTooltip from '../components/ui/ChartTooltip.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useResizeNudge } from '../hooks/useResizeNudge.js';
import { obtenerConfiabilidad } from '../services/proveedores.service.js';
import { RIESGO_META, nivelConfiabilidad } from '../lib/constantes.js';
import { numero, porcentaje, fechaCorta } from '../lib/format.js';
import { IconTruck, IconArrowUp, IconArrowDown } from '../components/icons.jsx';

const COLORES = ['#e2231a', '#2563eb', '#059669', '#9333ea', '#0891b2', '#d97706'];

function combinarTendencias(proveedores) {
  const porFecha = new Map();
  for (const p of proveedores) {
    for (const punto of p.tendencia) {
      const clave = new Date(punto.fecha).toISOString().slice(0, 10);
      if (!porFecha.has(clave)) porFecha.set(clave, { fecha: clave });
      porFecha.get(clave)[p.nombre] = punto.porcentaje;
    }
  }
  return [...porFecha.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export default function ConfiabilidadPage() {
  const { data, cargando, error, recargar } = useFetch(obtenerConfiabilidad, []);
  const proveedores = data ?? [];
  const serie = useMemo(() => combinarTendencias(proveedores), [proveedores]);
  useResizeNudge(serie.length);

  return (
    <div>
      <PageHeader
        title="Confiabilidad de proveedor"
        description="Cumplimiento histórico de cada proveedor: unidades entregadas frente a unidades solicitadas, y su evolución en el tiempo."
      />

      <DataState
        cargando={cargando}
        error={error}
        empty={!cargando && !error && proveedores.length === 0}
        emptyNode={<EmptyState icon={IconTruck} title="Sin proveedores registrados" />}
        onRetry={recargar}
        skeleton={
          <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="skeleton h-44 rounded-xl" />
              <div className="skeleton h-44 rounded-xl" />
              <div className="skeleton h-44 rounded-xl" />
            </div>
            <div className="skeleton h-80 rounded-xl" />
          </div>
        }
      >
        <div className="space-y-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Cumplimiento por proveedor</h3>
              <p className="text-xs text-slate-500">
                Porcentaje de entrega y nivel de confiabilidad calculado para cada proveedor.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {proveedores.map((p, i) => (
                <ProveedorCard key={p.id} proveedor={p} index={i} />
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200/70">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Evolución en el tiempo</h3>
              <p className="text-xs text-slate-500">
                Comparativa cronológica del cumplimiento recalculado con cada entrada registrada.
              </p>
            </div>
            <Card
              title="Histórico de entregas vs pedidos"
              subtitle="Trazabilidad por proveedor a lo largo del tiempo"
            >
              {serie.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  Aún no hay entradas con cantidad solicitada para trazar la evolución.
                </p>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer>
                    <LineChart data={serie} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#eef2f7" vertical={false} />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={fechaCorta}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[50, 105]}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickFormatter={(v) => `${v}%`}
                        axisLine={false}
                        tickLine={false}
                        width={44}
                      />
                      <Tooltip
                        content={<ChartTooltip unidad="%" labelFormatter={fechaCorta} />}
                        cursor={{ stroke: '#cbd5e1', strokeDasharray: 4 }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      {proveedores.map((p, i) => (
                        <Line
                          key={p.id}
                          type="monotone"
                          dataKey={p.nombre}
                          stroke={COLORES[i % COLORES.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                          connectNulls
                          isAnimationActive={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </div>
      </DataState>
    </div>
  );
}

function ProveedorCard({ proveedor, index }) {
  const nivel = nivelConfiabilidad(proveedor.porcentajeCumplimiento);
  const meta = RIESGO_META[nivel.clave];
  const puntos = proveedor.tendencia.map((t) => t.porcentaje);
  const ultimo = proveedor.tendencia.at(-1);
  const primero = proveedor.tendencia[0];
  const delta = ultimo && primero ? ultimo.porcentaje - primero.porcentaje : 0;

  return (
    <div
      className="surface-pad animate-fade-in-up transition-shadow duration-200 hover:shadow-card-hover"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-900">{proveedor.nombre}</p>
          <p className="text-xs text-slate-400">{numero(proveedor.productos)} productos</p>
        </div>
        <RiskBadge estado={nivel.clave} size="sm" />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <ProgressRing value={proveedor.porcentajeCumplimiento} color={meta.color} size={72} stroke={7}>
          <span className={`tnum text-sm font-bold ${meta.text}`}>
            {Math.round(proveedor.porcentajeCumplimiento)}%
          </span>
        </ProgressRing>

        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">{nivel.etiqueta}</p>
          {ultimo && (
            <p className="tnum mt-0.5 text-sm text-slate-600">
              {numero(ultimo.totalEntregado)} / {numero(ultimo.totalPedido)} u
            </p>
          )}
          {proveedor.tendencia.length > 1 && (
            <p
              className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                delta >= 0 ? 'text-risk-optimo' : 'text-risk-critico'
              }`}
            >
              {delta >= 0 ? <IconArrowUp className="h-3 w-3" /> : <IconArrowDown className="h-3 w-3" />}
              {porcentaje(Math.abs(delta))} en el periodo
            </p>
          )}
        </div>
      </div>

      {puntos.length > 1 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-1 text-[11px] font-medium text-slate-400">Tendencia histórica</p>
          <Sparkline data={puntos} width={260} height={36} color={meta.color} />
        </div>
      )}
    </div>
  );
}
