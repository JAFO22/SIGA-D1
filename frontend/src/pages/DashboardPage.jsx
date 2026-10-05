import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import RiskBadge from '../components/ui/RiskBadge.jsx';
import DataState from '../components/ui/DataState.jsx';
import ChartTooltip from '../components/ui/ChartTooltip.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { CardsSkeleton } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useResizeNudge } from '../hooks/useResizeNudge.js';
import { obtenerResumenDashboard } from '../services/dashboard.service.js';
import { numero, dias, diaCorto, fechaHora } from '../lib/format.js';
import { RIESGO_META } from '../lib/constantes.js';
import { IconBox, IconAlert, IconClock, IconChart, IconArrowUp, IconArrowDown } from '../components/icons.jsx';
import { cn } from '../lib/cn.js';

export default function DashboardPage() {
  const { data, cargando, error, recargar } = useFetch(obtenerResumenDashboard, []);
  const [productoSel, setProductoSel] = useState(null);
  const historico = data?.inventarioHistorico ?? [];
  useResizeNudge(historico.length);

  const serieActiva = useMemo(() => {
    if (historico.length === 0) return null;
    return historico.find((h) => h.productoId === productoSel) ?? historico[0];
  }, [historico, productoSel]);

  return (
    <div>
      <PageHeader
        title="Panel general"
        description="Estado del inventario, riesgo de quiebre y actividad reciente de la tienda D1."
      />

      <DataState
        cargando={cargando}
        error={error}
        onRetry={recargar}
        skeleton={
          <div className="space-y-6">
            <CardsSkeleton n={4} />
            <div className="skeleton h-80 rounded-xl" />
          </div>
        }
      >
        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard index={0} label="Productos" value={data.resumen.totalProductos} icon={IconBox} />
              <StatCard index={1} label="Nivel crítico" value={data.resumen.enRojo} icon={IconAlert} accent="critico" detail="Quiebre inminente" />
              <StatCard index={2} label="Nivel atención" value={data.resumen.enAmarillo} icon={IconClock} accent="atencion" detail="Reposición prioritaria" />
              <StatCard index={3} label="Nivel óptimo" value={data.resumen.enVerde} icon={IconChart} accent="optimo" detail="Cobertura estable" />
            </div>

            <Card
              title="Inventario histórico"
              subtitle="Modelo Stock & Flow · I(t+1) = I(t) + R(t) − V(t)"
              action={
                <select
                  className="input max-w-[220px] py-1.5 text-xs"
                  value={serieActiva?.productoId ?? ''}
                  onChange={(e) => setProductoSel(Number(e.target.value))}
                >
                  {historico.map((h) => (
                    <option key={h.productoId} value={h.productoId}>
                      {h.nombre}
                    </option>
                  ))}
                </select>
              }
            >
              {serieActiva && serieActiva.serie.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer>
                    <AreaChart data={serieActiva.serie} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                      <defs>
                        <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e2231a" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#e2231a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#eef2f7" vertical={false} />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={diaCorto}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={44}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={<ChartTooltip unidad=" u" labelFormatter={diaCorto} valueFormatter={numero} />}
                        cursor={{ stroke: '#cbd5e1', strokeDasharray: 4 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="inventario"
                        name="Inventario"
                        stroke="#e2231a"
                        strokeWidth={2}
                        fill="url(#invGrad)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon={IconChart} title="Sin movimientos para graficar" />
              )}
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Productos que requieren atención" bodyClassName="p-0">
                {data.alertasCriticas.length === 0 ? (
                  <div className="p-6">
                    <EmptyState icon={IconChart} title="Todo en nivel óptimo" hint="Ningún producto en nivel crítico o de atención." />
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.alertasCriticas.map((a) => {
                      const meta = RIESGO_META[a.estado];
                      return (
                        <li key={a.productoId} className="flex items-center gap-3 px-5 py-3">
                          <span className={cn('h-8 w-1 rounded-full', meta.bar)} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{a.nombre}</p>
                            <p className="text-xs text-slate-400">
                              {a.proveedor} · stock {numero(a.stockActual)}
                            </p>
                          </div>
                          <span className={cn('text-xs font-medium', meta.text)}>{dias(a.diasRestantes)}</span>
                          <RiskBadge estado={a.estado} size="sm" />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              <Card title="Actividad reciente" bodyClassName="p-0">
                <ul className="divide-y divide-slate-100">
                  {data.ultimosMovimientos.map((m) => (
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
              </Card>
            </div>
          </div>
        )}
      </DataState>
    </div>
  );
}
