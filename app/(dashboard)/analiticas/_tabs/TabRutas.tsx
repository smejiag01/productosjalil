/* eslint-disable prefer-const -- se asignan por desestructuración junto con variables declaradas arriba */
import { prisma } from "@/lib/prisma";
import { estadosPedido, marca } from "@/lib/design/tokens";
import GraficoBarras from "@/components/GraficoBarras";
import { type ContextoAnalitica, ORDEN_BUCKETS, LABELS_BUCKETS, type FilaVentasRuta, type FilaDevolucionRuta, type FilaTiempoRuta, type FilaRepartidor, type FilaBucket } from "./comunes";

export default async function TabRutas({ ctx }: { ctx: ContextoAnalitica }) {
  const { inicioDb, finDb } = ctx;
  let ventasPorRuta: FilaVentasRuta[] = [];
  let devolucionPorRuta: FilaDevolucionRuta[] = [];
  let tiempoPorRuta: FilaTiempoRuta[] = [];
  let rankingRepartidores: FilaRepartidor[] = [];
  let distribucionTiempos: { label: string; total: number }[] = [];

    let bucketsRaw: FilaBucket[];
    [ventasPorRuta, devolucionPorRuta, tiempoPorRuta, rankingRepartidores, bucketsRaw] = await Promise.all([
      prisma.$queryRaw<FilaVentasRuta[]>`
        SELECT COALESCE(r.nombre, 'Sin ruta') AS ruta,
               CAST(COUNT(p.id) AS INT) AS pedidos,
               CAST(SUM(p.total) AS FLOAT) AS total
        FROM pedidos p LEFT JOIN rutas r ON r.id = p.ruta_id
        WHERE p.fecha_pedido >= ${inicioDb} AND p.fecha_pedido <= ${finDb}
        GROUP BY r.id, r.nombre ORDER BY total DESC
      `,
      prisma.$queryRaw<FilaDevolucionRuta[]>`
        SELECT COALESCE(r.nombre, 'Sin ruta') AS ruta,
               CAST(COUNT(*) FILTER (WHERE p.estado = 'devuelto') AS INT) AS devueltos,
               CAST(COUNT(*) AS INT) AS total
        FROM pedidos p LEFT JOIN rutas r ON r.id = p.ruta_id
        WHERE p.fecha_pedido >= ${inicioDb} AND p.fecha_pedido <= ${finDb}
        GROUP BY r.id, r.nombre ORDER BY devueltos DESC
      `,
      prisma.$queryRaw<FilaTiempoRuta[]>`
        SELECT COALESCE(r.nombre, 'Sin ruta') AS ruta,
               CAST(AVG(EXTRACT(EPOCH FROM (p.entregado_at - p.confirmado_at)) / 3600) AS FLOAT) AS horas_promedio
        FROM pedidos p LEFT JOIN rutas r ON r.id = p.ruta_id
        WHERE p.estado = 'entregado' AND p.entregado_at IS NOT NULL AND p.confirmado_at IS NOT NULL
          AND p.fecha_pedido >= ${inicioDb} AND p.fecha_pedido <= ${finDb}
        GROUP BY r.id, r.nombre ORDER BY horas_promedio ASC
      `,
      prisma.$queryRaw<FilaRepartidor[]>`
        SELECT u.nombre AS repartidor,
               CAST(COUNT(*) FILTER (WHERE p.estado = 'entregado') AS INT) AS entregados,
               CAST(COUNT(*) FILTER (WHERE p.estado = 'devuelto') AS INT) AS devueltos
        FROM pedidos p JOIN usuarios u ON u.id = COALESCE(p.entregado_por, p.devuelto_por)
        WHERE p.fecha_pedido >= ${inicioDb} AND p.fecha_pedido <= ${finDb}
          AND p.estado IN ('entregado', 'devuelto')
        GROUP BY u.id, u.nombre ORDER BY entregados DESC
      `,
      prisma.$queryRaw<FilaBucket[]>`
        SELECT
          CASE
            WHEN EXTRACT(EPOCH FROM (entregado_at - confirmado_at)) / 3600 < 1 THEN '<1h'
            WHEN EXTRACT(EPOCH FROM (entregado_at - confirmado_at)) / 3600 < 3 THEN '1-3h'
            WHEN EXTRACT(EPOCH FROM (entregado_at - confirmado_at)) / 3600 < 6 THEN '3-6h'
            ELSE '+6h'
          END AS bucket,
          CAST(COUNT(*) AS INT) AS total
        FROM pedidos
        WHERE estado = 'entregado' AND entregado_at IS NOT NULL AND confirmado_at IS NOT NULL
          AND fecha_pedido >= ${inicioDb} AND fecha_pedido <= ${finDb}
        GROUP BY bucket
      `,
    ]);
    distribucionTiempos = ORDEN_BUCKETS.map((b) => ({
      label: LABELS_BUCKETS[b],
      total: bucketsRaw.find((r) => r.bucket === b)?.total ?? 0,
    }));

  return (
          <div className="space-y-6">
            {/* Ventas por ruta */}
            <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
              <h2 className="font-semibold text-ink-900 mb-4">Ventas por ruta</h2>
              <GraficoBarras
                datos={ventasPorRuta.map((r) => ({ label: r.ruta, total: r.total }))}
                claves={[{ key: "total", color: marca[600], label: "Ventas" }]}
                altura={220}
                formato="cop"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tasa de devolución por ruta */}
              <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-ink-100">
                  <h2 className="font-semibold text-ink-900">Tasa de devolución por ruta</h2>
                </div>
                {devolucionPorRuta.every((r) => r.total === 0) ? (
                  <div className="py-10 text-center text-ink-500 text-sm">Sin datos para este periodo</div>
                ) : (
                  <div className="divide-y divide-ink-50">
                    {devolucionPorRuta.map((r) => {
                      const tasa = r.total > 0 ? Math.round((r.devueltos / r.total) * 1000) / 10 : 0;
                      return (
                        <div key={r.ruta} className="px-5 py-3 flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium text-ink-900">{r.ruta}</p>
                            <p className="text-xs text-ink-500">{r.devueltos} de {r.total} pedidos</p>
                          </div>
                          <span className={`font-semibold ${tasa > 10 ? "text-danger" : "text-ink-900"}`}>
                            {tasa}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tiempo promedio de entrega por ruta */}
              <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-ink-100">
                  <h2 className="font-semibold text-ink-900">Tiempo promedio de entrega</h2>
                  <p className="text-xs text-ink-500 mt-0.5">Desde confirmado hasta entregado</p>
                </div>
                {tiempoPorRuta.length === 0 ? (
                  <div className="py-10 text-center text-ink-500 text-sm">Sin entregas completadas en el periodo</div>
                ) : (
                  <div className="divide-y divide-ink-50">
                    {tiempoPorRuta.map((r) => (
                      <div key={r.ruta} className="px-5 py-3 flex justify-between text-sm">
                        <span className="text-ink-900">{r.ruta}</span>
                        <span className="font-semibold text-ink-900">
                          {r.horas_promedio != null ? `${Math.round(r.horas_promedio * 10) / 10} h` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Distribución de tiempos de entrega */}
            <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
              <h2 className="font-semibold text-ink-900 mb-1">Distribución de tiempos de entrega</h2>
              <p className="text-xs text-ink-500 mb-4">Todas las rutas, desde confirmado hasta entregado</p>
              <GraficoBarras
                datos={distribucionTiempos}
                claves={[{ key: "total", color: estadosPedido.en_reparto.fondo, label: "Pedidos" }]}
                altura={200}
                formato="numero"
              />
            </div>

            {/* Ranking de repartidores */}
            <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-ink-100">
                <h2 className="font-semibold text-ink-900">Ranking de repartidores</h2>
              </div>
              {rankingRepartidores.length === 0 ? (
                <div className="py-10 text-center text-ink-500 text-sm">Sin entregas en el periodo</div>
              ) : (
                <div className="divide-y divide-ink-50">
                  {rankingRepartidores.map((r, i) => {
                    const totalR = r.entregados + r.devueltos;
                    const tasaDev = totalR > 0 ? Math.round((r.devueltos / totalR) * 1000) / 10 : 0;
                    return (
                      <div key={r.repartidor} className="px-5 py-3 flex items-center gap-3">
                        <span className="text-sm font-bold text-ink-300 w-5 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-900 truncate">{r.repartidor}</p>
                          <p className="text-xs text-ink-500">
                            {r.entregados} entregados · {r.devueltos} devueltos
                            {totalR > 0 && ` · ${tasaDev}% devolución`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
  );
}
