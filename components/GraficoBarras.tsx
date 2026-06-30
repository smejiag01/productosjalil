"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export interface ClaveBarra {
  key: string;
  color: string;
  label: string;
}

interface Props {
  datos: Record<string, string | number>[];
  claves: ClaveBarra[];
  labelKey?: string;
  altura?: number;
  apiladas?: boolean;
  formatearY?: (v: number) => string;
  formatearTooltip?: (v: number) => string;
}

function TooltipPersonalizado({
  active,
  payload,
  label,
  formatear,
}: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
  formatear?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const fmt = formatear ?? ((v: number) => String(v));
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-900">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function GraficoBarras({
  datos,
  claves,
  labelKey = "label",
  altura = 220,
  apiladas = false,
  formatearY,
  formatearTooltip,
}: Props) {
  const tieneData = datos.some((d) => claves.some((c) => (d[c.key] as number) > 0));

  if (!datos.length || !tieneData) {
    return (
      <div
        className="flex items-center justify-center text-gray-400 text-sm"
        style={{ height: altura }}
      >
        No hay datos para mostrar
      </div>
    );
  }

  const fmtY = formatearY ?? ((v: number) => String(v));

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={datos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey={labelKey}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={fmtY}
          width={48}
        />
        <Tooltip
          content={
            <TooltipPersonalizado formatear={formatearTooltip ?? fmtY} />
          }
        />
        {claves.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) => claves.find((c) => c.key === value)?.label ?? value}
          />
        )}
        {claves.map((c) => (
          <Bar
            key={c.key}
            dataKey={c.key}
            name={c.label}
            fill={c.color}
            stackId={apiladas ? "stack" : undefined}
            radius={apiladas ? [0, 0, 0, 0] : [3, 3, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
