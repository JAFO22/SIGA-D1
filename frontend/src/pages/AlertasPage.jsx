import { useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import RiskBadge from '../components/ui/RiskBadge.jsx';
import DataState from '../components/ui/DataState.jsx';
import MeterBar from '../components/ui/MeterBar.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { listarAlertas, obtenerConfigSemaforo } from '../services/alertas.service.js';
import { RIESGO_META } from '../lib/constantes.js';
import { numero, decimal, dias } from '../lib/format.js';
import { cn } from '../lib/cn.js';

const FILTROS = [
  { clave: 'TODOS', label: 'Todos' },
  { clave: 'ROJO', label: 'Crítico' },
  { clave: 'AMARILLO', label: 'Atención' },
  { clave: 'VERDE', label: 'Óptimo' },
];

export default function AlertasPage() {
  const { data: alertas, cargando, error, recargar } = useFetch(listarAlertas, []);
  const { data: config } = useFetch(obtenerConfigSemaforo, []);
  const [filtro, setFiltro] = useState('TODOS');

  const lista = alertas ?? [];

  const conteo = useMemo(() => {
    const base = { ROJO: 0, AMARILLO: 0, VERDE: 0 };
    for (const a of lista) base[a.estado] += 1;
    return base;
  }, [lista]);

  const filtradas = useMemo(() => {
    const orden = [...lista].sort(
      (a, b) => RIESGO_META[a.estado].prioridad - RIESGO_META[b.estado].prioridad,
    );
    return filtro === 'TODOS' ? orden : orden.filter((a) => a.estado === filtro);
  }, [lista, filtro]);

  const total = lista.length || 1;

  const columnas = [
    {
      clave: 'nombre',
      titulo: 'Producto',
      render: (f) => (
        <div>
          <p className="font-medium text-slate-900">{f.nombre}</p>
          <p className="text-xs text-slate-400">
            {f.categoria} · {f.proveedor}
          </p>
        </div>
      ),
    },
    { clave: 'stockActual', titulo: 'Stock', align: 'right', render: (f) => numero(f.stockActual) },
    {
      clave: 'ritmoVentaDiario',
      titulo: 'Consumo/día',
      align: 'right',
      render: (f) => `${decimal(f.ritmoVentaDiario)} u`,
    },
    {
      clave: 'diasRestantes',
      titulo: 'Cobertura',
      render: (f) => <CoberturaCelda item={f} config={config} />,
    },
    {
      clave: 'estado',
      titulo: 'Nivel',
      align: 'right',
      render: (f) => (
        <div className="flex justify-end">
          <RiskBadge estado={f.estado} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Riesgo de quiebre"
        description="Proyección de cobertura por producto según el consumo diario estimado (promedio de las últimas salidas registradas)."
      />

      <DataState
        cargando={cargando}
        error={error}
        onRetry={recargar}
        skeleton={
          <div className="space-y-6">
            <div className="skeleton h-24 rounded-xl" />
            <TableSkeleton columnas={5} />
          </div>
        }
      >
        <Card className="mb-6" bodyClassName="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6">
              {['ROJO', 'AMARILLO', 'VERDE'].map((e) => {
                const m = RIESGO_META[e];
                return (
                  <div key={e} className="flex items-center gap-2.5">
                    <span className={cn('h-2.5 w-2.5 rounded-full', m.dot)} />
                    <div>
                      <p className="tnum text-xl font-semibold text-slate-900">{conteo[e]}</p>
                      <p className="text-xs text-slate-500">{m.nivel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400">{lista.length} productos monitoreados</p>
          </div>

          <MeterBar
            className="mt-4 h-2.5"
            segments={['ROJO', 'AMARILLO', 'VERDE'].map((e) => ({
              value: (conteo[e] / total) * 100,
              className: RIESGO_META[e].bar,
            }))}
          />
        </Card>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const activo = filtro === f.clave;
            const n = f.clave === 'TODOS' ? lista.length : conteo[f.clave];
            return (
              <button
                key={f.clave}
                type="button"
                onClick={() => setFiltro(f.clave)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  activo
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                {f.label}
                <span className={cn('tnum', activo ? 'text-slate-300' : 'text-slate-400')}>{n}</span>
              </button>
            );
          })}
        </div>

        <DataTable
          columnas={columnas}
          filas={filtradas}
          obtenerId={(f) => f.productoId}
          vacio="Sin productos en este nivel."
        />

        {config && (
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            Umbrales configurables (variables de entorno del backend):{' '}
            <b className="text-slate-500">Crítico</b> si la cobertura es ≤ {config.diasRojo} días o el
            stock es cero; <b className="text-slate-500">Atención</b> hasta {config.diasAmarillo} días;{' '}
            <b className="text-slate-500">Óptimo</b> por encima. El consumo diario se estima con las
            últimas {config.ventasMuestra} salidas.
          </p>
        )}
      </DataState>
    </div>
  );
}

function CoberturaCelda({ item, config }) {
  const meta = RIESGO_META[item.estado];
  const max = (config?.diasAmarillo ?? 7) * 2;
  const pct = item.diasRestantes === null ? 0 : Math.min(100, (item.diasRestantes / max) * 100);

  return (
    <div className="w-40">
      <span className={cn('text-sm font-medium', meta.text)}>{dias(item.diasRestantes)}</span>
      <MeterBar className="mt-1 h-1.5" trackClass={meta.track} value={pct} barClass={meta.bar} />
    </div>
  );
}
