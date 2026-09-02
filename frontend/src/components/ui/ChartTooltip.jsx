// Tooltip con estilo propio para las gráficas de Recharts.
// Uso: <Tooltip content={<ChartTooltip unidad=" u" />} />

export default function ChartTooltip({ active, payload, label, labelFormatter, unidad = '', valueFormatter }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-pop backdrop-blur">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.stroke }} />
            <span className="text-slate-500">{p.name}</span>
            <span className="tnum ml-auto font-semibold text-slate-900">
              {valueFormatter ? valueFormatter(p.value) : p.value}
              {unidad}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
