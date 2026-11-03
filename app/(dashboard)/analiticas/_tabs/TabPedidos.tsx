import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import { addDias } from "@/lib/analiticas/periodos";
import { semantica } from "@/lib/design/tokens";
import GraficoBarras from "@/components/GraficoBarras";
import { type ContextoAnalitica, ESTADOS_COLORES, ESTADOS_LABELS, diffDias, type FilaEstado, type FilaTiempo, type FilaHoraPico } from "./comunes";

export default async function TabPedidos({ ctx }: { ctx: ContextoAnalitica }) {
  const { rango, inicioDb, finDb } = ctx;
  let totalPedidos = 0, cancelados = 0, tasaCancelacion = 0;
  let porEstado: { estado: string; count: number }[] = [];
  let seriePedidos: Record<string, string | number>[] = [];
  let horasConfirmacion: number | null = null;
  let horasTotalPedido: number | null = null;
  let valorPerdidoDevoluciones = 0;
  let pedidosPorHora: { label: string; total: number }[] = [];

    const [
      estadosRaw,
      serieRaw,
      confirmacionRaw,
      totalPedidoRaw,
      devolucionesRaw,
      horaPicoRaw,
    ] = await Promise.all([
      prisma.pedidos.groupBy({
        by: ["estado"],
        where: { fecha_pedido: { gte: inicioDb, lte: finDb } },
        _count: { id: true },
      }),
      prisma.$queryRaw<FilaEstado[]>`
        SELECT fecha_pedido AS fecha, estado, CAST(COUNT(*) AS INT) AS count
        FROM pedidos
        WHERE fecha_pedido >= ${inicioDb} AND fecha_pedido <= ${finDb}
        GROUP BY fecha_pedido, estado ORDER BY fecha_pedido
      `,
      prisma.$queryRaw<FilaTiempo[]>`
        SELECT CAST(AVG(EXTRACT(EPOCH FROM (confirmado_at - created_at)) / 3600) AS FLOAT) AS horas_promedio
        FROM pedidos
        WHERE confirmado_at IS NOT NULL
          AND fecha_pedido >= ${inicioDb} AND fecha_pedido <= ${finDb}
      `,
      prisma.$queryRaw<FilaTiempo[]>`
        SELECT CAST(AVG(EXTRACT(EPOCH FROM (entregado_at - created_at)) / 3600) AS FLOAT) AS horas_promedio
        FROM pedidos
        WHERE estado = 'entregado' AND entregado_at IS NOT NULL
          AND fecha_pedido >= ${inicioDb} AND fecha_pedido <= ${finDb}
      `,
      prisma.$queryRaw<{ total: number | null }[]>`
        SELECT CAST(SUM(total) AS FLOAT) AS total
        FROM pedidos
        WHERE estado = 'devuelto'
          AND fecha_pedido >= ${inicioDb} AND fecha_pedido <= ${finDb}
      `,
      prisma.$queryRaw<FilaHoraPico[]>`
        SELECT CAST(EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Bogota') AS INT) AS hora,
               CAST(COUNT(*) AS INT) AS total
        FROM pedidos
        WHERE fecha_pedido >= ${inicioDb} AND fecha_pedido <= ${finDb}
        GROUP BY hora ORDER BY hora
      `,
    ]);
    porEstado = estadosRaw.map((e) => ({ estado: e.estado, count: e._count.id }));
    totalPedidos = porEstado.reduce((s, r) => s + r.count, 0);
    cancelados = porEstado.find((r) => r.estado === "cancelado")?.count ?? 0;
    tasaCancelacion = totalPedidos > 0 ? Math.round((cancelados / totalPedidos) * 1000) / 10 : 0;
    horasConfirmacion = confirmacionRaw[0]?.horas_promedio ?? null;
    horasTotalPedido = totalPedidoRaw[0]?.horas_promedio ?? null;
    valorPerdidoDevoluciones = devolucionesRaw[0]?.total ?? 0;
    pedidosPorHora = Array.from({ length: 24 }, (_, h) => {
      const found = horaPicoRaw.find((r) => r.hora === h);
      return { label: `${h}h`, total: found ? found.total : 0 };
    });
    const dias = diffDias(rango.inicio, rango.fin) + 1;
    const estados = Object.keys(ESTADOS_COLORES);
    seriePedidos = Array.from({ length: dias }, (_, i) => {
      const fechaStr = addDias(rango.inicio, i);
      const [yy, mm, dd] = fechaStr.split("-").map(Number);
      const label = new Date(Date.UTC(yy, mm - 1, dd)).toLocaleDateString("es-CO", {
        day: "numeric", month: "short", timeZone: "UTC",
      });
      const fila: Record<string, string | number> = { fecha: fechaStr, label };
      for (const est of estados) {
        const found = serieRaw.find((v) => v.fecha.toISOString().split("T")[0] === fechaStr && v.estado === est);
        fila[est] = found ? found.count : 0;
      }
      return fila;
    });

  return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-1">Total pedidos</p>
                <p className="text-3xl font-bold text-ink-900">{totalPedidos}</p>
              </div>
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-1">Tasa de cancelación</p>
                <p className={`text-3xl font-bold ${tasaCancelacion > 10 ? "text-danger" : "text-ink-900"}`}>
                  {tasaCancelacion}%
                </p>
                <p className="text-xs text-ink-500 mt-1">{cancelados} cancelados</p>
              </div>
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-2">Por estado</p>
                <div className="space-y-1">
                  {porEstado.map((e) => (
                    <div key={e.estado} className="flex justify-between text-sm">
                      <span className="text-ink-700">{ESTADOS_LABELS[e.estado] ?? e.estado}</span>
                      <span className="font-semibold text-ink-900">{e.count}</span>
                    </div>
                  ))}
                  {porEstado.length === 0 && <p className="text-sm text-ink-500">Sin datos</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-1">Tiempo promedio de confirmación</p>
                <p className="text-3xl font-bold text-ink-900">
                  {horasConfirmacion != null ? `${Math.round(horasConfirmacion * 10) / 10} h` : "—"}
                </p>
                <p className="text-xs text-ink-500 mt-1">desde que se crea hasta que se confirma</p>
              </div>
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-1">Tiempo total del pedido</p>
                <p className="text-3xl font-bold text-ink-900">
                  {horasTotalPedido != null ? `${Math.round(horasTotalPedido * 10) / 10} h` : "—"}
                </p>
                <p className="text-xs text-ink-500 mt-1">desde que se crea hasta que se entrega</p>
              </div>
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-1">Valor perdido en devoluciones</p>
                <p className={`text-3xl font-bold ${valorPerdidoDevoluciones > 0 ? "text-danger" : "text-ink-900"}`}>
                  {formatearPrecio(valorPerdidoDevoluciones)}
                </p>
                <p className="text-xs text-ink-500 mt-1">total de pedidos devueltos en el periodo</p>
              </div>
            </div>

            <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
              <h2 className="font-semibold text-ink-900 mb-4">Pedidos por día</h2>
              <GraficoBarras
                datos={seriePedidos}
                apiladas
                claves={Object.keys(ESTADOS_COLORES).map((est) => ({
                  key: est,
                  color: ESTADOS_COLORES[est],
                  label: ESTADOS_LABELS[est],
                }))}
                altura={240}
                formato="numero"
              />
            </div>

            <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
              <h2 className="font-semibold text-ink-900 mb-4">Pedidos por hora del día</h2>
              <GraficoBarras
                datos={pedidosPorHora}
                claves={[{ key: "total", color: semantica.info, label: "Pedidos" }]}
                altura={220}
                formato="numero"
              />
            </div>
          </div>
  );
}
