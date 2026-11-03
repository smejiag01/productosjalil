/* eslint-disable prefer-const -- se asignan por desestructuración junto con variables declaradas arriba */
import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import { type ContextoAnalitica, DIAS_INACTIVIDAD, type FilaCliente, type FilaInactivo, type FilaClientePrecio, type FilaVentasRuta, type FilaFrecuencia, type FilaRetencion, type FilaMultiSede } from "./comunes";

export default async function TabClientes({ ctx }: { ctx: ContextoAnalitica }) {
  const { inicioDb, finDb, inicioAntDb, finAntDb, inicioTs, finTs } = ctx;
  let masActivos: FilaCliente[] = [];
  let clientesNuevos = 0;
  let inactivos: FilaInactivo[] = [];
  let ventasPorRutaClientes: FilaVentasRuta[] = [];
  let clientesConPrecio = 0;
  let clientesSinPrecio = 0;
  let frecuenciaPromedio: number | null = null;
  let tasaRetencion: number | null = null;
  let clientesRetenidos = 0;
  let clientesAnteriorTotal = 0;
  let clientesMultiSede = 0;

    let clientesConPrecioRaw: FilaClientePrecio[];
    let frecuenciaRaw: FilaFrecuencia[];
    let retencionRaw: FilaRetencion[];
    let multiSedeRaw: FilaMultiSede[];
    [
      masActivos,
      clientesNuevos,
      inactivos,
      ventasPorRutaClientes,
      clientesConPrecioRaw,
      frecuenciaRaw,
      retencionRaw,
      multiSedeRaw,
    ] = await Promise.all([
      prisma.$queryRaw<FilaCliente[]>`
        SELECT c.nombre, CAST(COUNT(p.id) AS INT) AS pedidos, CAST(SUM(p.total) AS FLOAT) AS total
        FROM pedidos p JOIN clientes c ON c.id = p.cliente_id
        WHERE p.fecha_pedido >= ${inicioDb} AND p.fecha_pedido <= ${finDb}
        GROUP BY c.id, c.nombre ORDER BY total DESC LIMIT 10
      `,
      prisma.clientes.count({ where: { created_at: { gte: inicioTs, lte: finTs } } }),
      prisma.$queryRaw<FilaInactivo[]>`
        SELECT c.nombre,
               CAST(EXTRACT(day FROM NOW() - MAX(p.fecha_pedido::timestamp)) AS INT) AS dias
        FROM clientes c LEFT JOIN pedidos p ON p.cliente_id = c.id
        WHERE c.activo = true GROUP BY c.id, c.nombre
        HAVING MAX(p.fecha_pedido) < NOW() - make_interval(days => CAST(${DIAS_INACTIVIDAD} AS INT))
            OR MAX(p.fecha_pedido) IS NULL
        ORDER BY dias DESC NULLS LAST LIMIT 10
      `,
      prisma.$queryRaw<FilaVentasRuta[]>`
        SELECT COALESCE(r.nombre, 'Sin ruta') AS ruta,
               CAST(COUNT(p.id) AS INT) AS pedidos,
               CAST(SUM(p.total) AS FLOAT) AS total
        FROM pedidos p LEFT JOIN rutas r ON r.id = p.ruta_id
        WHERE p.fecha_pedido >= ${inicioDb} AND p.fecha_pedido <= ${finDb}
        GROUP BY r.id, r.nombre ORDER BY total DESC
      `,
      prisma.$queryRaw<FilaClientePrecio[]>`
        SELECT CAST(COUNT(DISTINCT pc.cliente_id) AS INT) AS con_precio,
               CAST((SELECT COUNT(*) FROM clientes WHERE activo = true) - COUNT(DISTINCT pc.cliente_id) AS INT) AS sin_precio
        FROM precios_cliente pc JOIN clientes c ON c.id = pc.cliente_id
        WHERE c.activo = true
      `,
      prisma.$queryRaw<FilaFrecuencia[]>`
        SELECT CAST(AVG(intervalo_dias) AS FLOAT) AS frecuencia_promedio
        FROM (
          SELECT cliente_id,
                 CAST(fecha_pedido - LAG(fecha_pedido) OVER (PARTITION BY cliente_id ORDER BY fecha_pedido) AS INT) AS intervalo_dias
          FROM pedidos
          WHERE estado != 'cancelado'
        ) t
        WHERE intervalo_dias IS NOT NULL AND intervalo_dias > 0
      `,
      prisma.$queryRaw<FilaRetencion[]>`
        WITH anterior AS (
          SELECT DISTINCT cliente_id FROM pedidos
          WHERE fecha_pedido >= ${inicioAntDb} AND fecha_pedido <= ${finAntDb} AND estado != 'cancelado'
        ), actual AS (
          SELECT DISTINCT cliente_id FROM pedidos
          WHERE fecha_pedido >= ${inicioDb} AND fecha_pedido <= ${finDb} AND estado != 'cancelado'
        )
        SELECT
          CAST((SELECT COUNT(*) FROM anterior) AS INT) AS anterior_total,
          CAST((SELECT COUNT(*) FROM anterior a JOIN actual b ON a.cliente_id = b.cliente_id) AS INT) AS retenidos
      `,
      prisma.$queryRaw<FilaMultiSede[]>`
        SELECT CAST(COUNT(*) AS INT) AS multi_sede
        FROM (
          SELECT cliente_id FROM sedes WHERE activa = true GROUP BY cliente_id HAVING COUNT(*) > 1
        ) t
      `,
    ]);
    clientesConPrecio = clientesConPrecioRaw[0]?.con_precio ?? 0;
    clientesSinPrecio = clientesConPrecioRaw[0]?.sin_precio ?? 0;
    frecuenciaPromedio = frecuenciaRaw[0]?.frecuencia_promedio ?? null;
    clientesAnteriorTotal = retencionRaw[0]?.anterior_total ?? 0;
    clientesRetenidos = retencionRaw[0]?.retenidos ?? 0;
    tasaRetencion = clientesAnteriorTotal > 0
      ? Math.round((clientesRetenidos / clientesAnteriorTotal) * 1000) / 10
      : null;
    clientesMultiSede = multiSedeRaw[0]?.multi_sede ?? 0;

  return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Más activos */}
              <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden sm:col-span-2 lg:col-span-1">
                <div className="px-5 py-4 border-b border-ink-100">
                  <h2 className="font-semibold text-ink-900">Clientes más activos</h2>
                </div>
                {masActivos.length === 0 ? (
                  <div className="py-10 text-center text-ink-500 text-sm">Sin datos para este periodo</div>
                ) : (
                  <div className="divide-y divide-ink-50">
                    {masActivos.map((c, i) => (
                      <div key={c.nombre} className="px-5 py-3 flex items-center gap-3">
                        <span className="text-sm font-bold text-ink-300 w-5 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-900 truncate">{c.nombre}</p>
                          <p className="text-xs text-ink-500">{c.pedidos} {c.pedidos === 1 ? "pedido" : "pedidos"}</p>
                        </div>
                        <span className="text-sm font-semibold text-ink-900 flex-shrink-0">{formatearPrecio(c.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Clientes nuevos */}
                <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                  <p className="text-sm text-ink-600 mb-1">Clientes nuevos</p>
                  <p className="text-3xl font-bold text-ink-900">{clientesNuevos}</p>
                  <p className="text-xs text-ink-500 mt-1">registrados en el periodo</p>
                </div>

                {/* Inactivos */}
                <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-ink-100">
                    <h3 className="text-sm font-semibold text-ink-900">
                      Sin pedido reciente
                      <span className="ml-1 text-xs font-normal text-ink-500">(+{DIAS_INACTIVIDAD} días)</span>
                    </h3>
                  </div>
                  {inactivos.length === 0 ? (
                    <div className="py-6 text-center text-ink-500 text-sm">Todos activos</div>
                  ) : (
                    <div className="divide-y divide-ink-50">
                      {inactivos.map((c) => (
                        <div key={c.nombre} className="px-5 py-2.5 flex justify-between text-sm">
                          <span className="text-ink-900 truncate">{c.nombre}</span>
                          <span className="text-ink-500 flex-shrink-0 ml-2">
                            {c.dias != null ? `${c.dias} días` : "Nunca"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Ventas por ruta */}
              <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-ink-100">
                  <h2 className="font-semibold text-ink-900">Ventas por ruta</h2>
                </div>
                {ventasPorRutaClientes.length === 0 ? (
                  <div className="py-10 text-center text-ink-500 text-sm">Sin datos para este periodo</div>
                ) : (
                  <div className="divide-y divide-ink-50">
                    {ventasPorRutaClientes.map((r) => (
                      <div key={r.ruta} className="px-5 py-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-ink-900">{r.ruta}</p>
                          <p className="text-xs text-ink-500">{r.pedidos} {r.pedidos === 1 ? "pedido" : "pedidos"}</p>
                        </div>
                        <span className="font-semibold text-ink-900">{formatearPrecio(r.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Precios personalizados */}
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-3">Clientes con precio personalizado</p>
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-3xl font-bold text-ink-900">{clientesConPrecio}</p>
                    <p className="text-xs text-ink-500 mt-1">con al menos un precio propio</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-ink-500">{clientesSinPrecio}</p>
                    <p className="text-xs text-ink-500 mt-1">usan solo el precio base</p>
                  </div>
                </div>
                {clientesConPrecio + clientesSinPrecio > 0 && (
                  <div className="mt-4 h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand"
                      style={{ width: `${Math.round((clientesConPrecio / (clientesConPrecio + clientesSinPrecio)) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-1">Frecuencia promedio de pedido</p>
                <p className="text-3xl font-bold text-ink-900">
                  {frecuenciaPromedio != null ? `${Math.round(frecuenciaPromedio)} días` : "—"}
                </p>
                <p className="text-xs text-ink-500 mt-1">entre un pedido y el siguiente (histórico)</p>
              </div>
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-1">Retención vs. periodo anterior</p>
                <p className="text-3xl font-bold text-ink-900">
                  {tasaRetencion != null ? `${tasaRetencion}%` : "—"}
                </p>
                <p className="text-xs text-ink-500 mt-1">
                  {clientesAnteriorTotal > 0
                    ? `${clientesRetenidos} de ${clientesAnteriorTotal} volvieron a pedir`
                    : "sin pedidos en el periodo anterior"}
                </p>
              </div>
              <div className="bg-white rounded-card border border-ink-200 shadow-card p-5">
                <p className="text-sm text-ink-600 mb-1">Clientes con más de una sede</p>
                <p className="text-3xl font-bold text-ink-900">{clientesMultiSede}</p>
                <p className="text-xs text-ink-500 mt-1">negocios con varios puntos de entrega</p>
              </div>
            </div>
          </div>
  );
}
