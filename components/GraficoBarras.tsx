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

// "numero" → muestra el número tal cual; "cop" → formato $1.250.000
type Formato = "numero" | "cop";

interface Props {
  datos: Record<string, string | number>[];
  claves: ClaveBarra[];
  labelKey?: string;
  altura?: number;
  apiladas?: boolean;
  formato?: Formato;
}

function fmt(v: number, f: Formato): string {
  if (f === "cop") {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  }
  return String(v);
}

function TooltipPersonalizado({
  active,
  payload,
  label,
  formato,
}: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
  formato: Formato;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-900">{fmt(p.value, formato)}</span>
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
  formato = "numero",
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
          tickFormatter={(v: number) => fmt(v, formato)}
          width={48}
        />
        <Tooltip content={<TooltipPersonalizado formato={formato} />} />
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
