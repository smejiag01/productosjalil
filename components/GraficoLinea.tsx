"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Punto {
  label: string;
  total: number;
  [key: string]: string | number;
}

interface Props {
  datos: Punto[];
  altura?: number;
  color?: string;
}

function formatCOP(valor: number): string {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

function TooltipPersonalizado({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900">{formatCOP(payload[0].value)}</p>
    </div>
  );
}

export default function GraficoLinea({ datos, altura = 220, color = "#8B1A1A" }: Props) {
  if (!datos.length || datos.every((d) => d.total === 0)) {
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
      <LineChart data={datos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) =>
            v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}K` : `$${v}`
          }
          width={56}
        />
        <Tooltip content={<TooltipPersonalizado />} />
        <Line
          type="monotone"
          dataKey="total"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
