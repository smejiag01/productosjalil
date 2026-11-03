import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import { addDias, calcularRango, fmtShort } from "@/lib/analiticas/periodos";
import GraficoLinea from "@/components/GraficoLinea";
import { type ContextoAnalitica, diffDias, type FilaVentas } from "./comunes";

export default async function TabVentas({ ctx }: { ctx: ContextoAnalitica }) {
  const { rango, periodo, esPersonalizado, inicioDb, finDb, inicioAntDb, finAntDb } = ctx;
  let serieVentas: { fecha: string; label: string; total: number }[] = [];
  let totalVentas = 0, totalAnterior = 0, ticketPromedio = 0, variacion = 0, totalPedidosVentas = 0;

    const [serieRaw, antRaw] = await Promise.all([
      prisma.$queryRaw<FilaVentas[]>`
        SELECT fecha_pedido AS fecha, CAST(SUM(total) AS FLOAT) AS total
        FROM pedidos
        WHERE fecha_pedido >= ${inicioDb} AND fecha_pedido <= ${finDb}
        GROUP BY fecha_pedido ORDER BY fecha_pedido
      `,
      prisma.$queryRaw<{ total: number; pedidos: number }[]>`
        SELECT CAST(SUM(total) AS FLOAT) AS total, CAST(COUNT(*) AS INT) AS pedidos
        FROM pedidos
        WHERE fecha_pedido >= ${inicioAntDb} AND fecha_pedido <= ${finAntDb}
      `,
    ]);
    const conteoPeriodo = await prisma.pedidos.count({
      where: { fecha_pedido: { gte: inicioDb, lte: finDb } },
    });
    const dias = diffDias(rango.inicio, rango.fin) + 1;
    serieVentas = Array.from({ length: dias }, (_, i) => {
      const fechaStr = addDias(rango.inicio, i);
      const fila = serieRaw.find((v) => v.fecha.toISOString().split("T")[0] === fechaStr);
      const [yy, mm, dd] = fechaStr.split("-").map(Number);
      const label = new Date(Date.UTC(yy, mm - 1, dd)).toLocaleDateString("es-CO", {
        day: "numeric", month: "short", timeZone: "UTC",
      });
      return { fecha: fechaStr, label, total: fila ? fila.total : 0 };
    });
    totalVentas = serieVentas.reduce((s, r) => s + r.total, 0);
    totalPedidosVentas = conteoPeriodo;
    totalAnterior = antRaw[0]?.total ?? 0;
    ticketPromedio = conteoPeriodo > 0 ? totalVentas / conteoPeriodo : 0;
    variacion = totalAnterior > 0
      ? ((totalVentas - totalAnterior) / totalAnterior) * 100
      : totalVentas > 0 ? 100 : 0;

  return (
          <div className="space-y-6">
            {/* Métricas clave */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-1">Total del periodo</p>
                <p className="text-3xl font-bold text-ink-900">{formatearPrecio(totalVentas)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-sm font-semibold ${variacion >= 0 ? "text-ok" : "text-danger"}`}>
                    {variacion >= 0 ? "↑" : "↓"} {Math.abs(Math.round(variacion * 10) / 10)}%
                  </span>
                  <span className="text-xs text-ink-500">vs. periodo anterior</span>
                </div>
              </div>
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-1">Ticket promedio</p>
                <p className="text-3xl font-bold text-ink-900">{formatearPrecio(ticketPromedio)}</p>
                <p className="text-xs text-ink-500 mt-1">{totalPedidosVentas} pedidos en el periodo</p>
              </div>
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-1">Periodo anterior</p>
                <p className="text-3xl font-bold text-ink-500">{formatearPrecio(totalAnterior)}</p>
                <p className="text-xs text-ink-500 mt-1 capitalize">
                  {esPersonalizado
                    ? `${fmtShort(rango.inicioAnterior)} – ${fmtShort(rango.finAnterior)}`
                    : calcularRango(periodo, rango.inicioAnterior).navLabel}
                </p>
              </div>
            </div>

            {/* Gráfico */}
            <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
              <h2 className="font-semibold text-ink-900 mb-4">Ventas por día</h2>
              <GraficoLinea datos={serieVentas} altura={240} />
            </div>
          </div>
  );
}
