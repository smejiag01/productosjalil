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
    <div className="bg-white border border-ink-200 rounded-control shadow-raised px-3 py-2">
      <p className="text-xs text-ink-600 mb-1">{label}</p>
      <p className="text-sm font-bold text-ink-900">{formatCOP(payload[0].value)}</p>
    </div>
  );
}

export default function GraficoLinea({ datos, altura = 220, color = "#BC4220" }: Props) {
  if (!datos.length || datos.every((d) => d.total === 0)) {
    return (
      <div
        className="flex items-center justify-center text-ink-600 text-sm"
        style={{ height: altura }}
      >
        No hay datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <LineChart data={datos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6DCCB" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#6B5850" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6B5850" }}
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
