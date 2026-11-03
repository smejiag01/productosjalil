import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import { type ContextoAnalitica, TIPOS_INV_LABEL, type FilaConsumo, type FilaMerma, type FilaRotacion, type FilaProduccion, type FilaAlertaDias } from "./comunes";

export default async function TabInventario({ ctx }: { ctx: ContextoAnalitica }) {
  const { inicioTs, finTs } = ctx;
  let consumoPorTipo: FilaConsumo[] = [];
  let mermas: FilaMerma[] = [];
  let totalMermasCosto = 0;
  let masRotacion: FilaRotacion[] = [];
  let sinRotacion: { nombre: string }[] = [];
  let produccion: FilaProduccion[] = [];
  let alertasDiasSinEntrada: FilaAlertaDias[] = [];

    [consumoPorTipo, mermas, masRotacion, sinRotacion, produccion, alertasDiasSinEntrada] = await Promise.all([
      prisma.$queryRaw<FilaConsumo[]>`
        SELECT ii.tipo, CAST(SUM(im.cantidad) AS FLOAT) AS cantidad
        FROM inventario_movimientos im JOIN inventario_items ii ON ii.id = im.item_id
        WHERE im.tipo = 'salida' AND im.created_at >= ${inicioTs} AND im.created_at <= ${finTs}
        GROUP BY ii.tipo ORDER BY cantidad DESC
      `,
      prisma.$queryRaw<FilaMerma[]>`
        SELECT ii.nombre,
               CAST(SUM(im.cantidad) AS FLOAT) AS cantidad,
               CAST(SUM(im.cantidad * ii.costo_unitario) AS FLOAT) AS costo_total
        FROM inventario_movimientos im JOIN inventario_items ii ON ii.id = im.item_id
        WHERE im.motivo = 'merma' AND im.created_at >= ${inicioTs} AND im.created_at <= ${finTs}
        GROUP BY ii.id, ii.nombre ORDER BY costo_total DESC LIMIT 10
      `,
      prisma.$queryRaw<FilaRotacion[]>`
        SELECT ii.nombre, CAST(COUNT(im.id) AS INT) AS movimientos
        FROM inventario_items ii
        LEFT JOIN inventario_movimientos im ON im.item_id = ii.id
          AND im.created_at >= ${inicioTs} AND im.created_at <= ${finTs}
        WHERE ii.activo = true GROUP BY ii.id, ii.nombre
        HAVING COUNT(im.id) > 0 ORDER BY movimientos DESC LIMIT 10
      `,
      prisma.$queryRaw<{ nombre: string }[]>`
        SELECT ii.nombre FROM inventario_items ii
        WHERE ii.activo = true AND NOT EXISTS (
          SELECT 1 FROM inventario_movimientos im
          WHERE im.item_id = ii.id AND im.created_at >= ${inicioTs} AND im.created_at <= ${finTs}
        )
        ORDER BY ii.nombre LIMIT 10
      `,
      prisma.$queryRaw<FilaProduccion[]>`
        SELECT ii.nombre, CAST(SUM(im.cantidad) AS FLOAT) AS cantidad
        FROM inventario_movimientos im JOIN inventario_items ii ON ii.id = im.item_id
        WHERE im.motivo = 'produccion' AND im.tipo = 'entrada'
          AND im.created_at >= ${inicioTs} AND im.created_at <= ${finTs}
        GROUP BY ii.id, ii.nombre ORDER BY cantidad DESC LIMIT 10
      `,
      prisma.$queryRaw<FilaAlertaDias[]>`
        SELECT ii.id::text AS id, ii.nombre,
               CAST(EXTRACT(day FROM NOW() - MAX(im.created_at)) AS INT) AS dias_sin_entrada
        FROM inventario_items ii
        LEFT JOIN inventario_movimientos im ON im.item_id = ii.id AND im.tipo = 'entrada'
        WHERE ii.activo = true AND ii.stock_actual <= ii.stock_minimo
        GROUP BY ii.id, ii.nombre
        ORDER BY dias_sin_entrada DESC NULLS FIRST
        LIMIT 10
      `,
    ]);
    totalMermasCosto = mermas.reduce((s, m) => s + m.costo_total, 0);

  return (
          <div className="space-y-6">
            {/* Consumo por tipo */}
            <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-ink-100">
                <h2 className="font-semibold text-ink-900">Consumo por tipo (salidas)</h2>
              </div>
              {consumoPorTipo.length === 0 ? (
                <div className="py-10 text-center text-ink-500 text-sm">Sin movimientos de salida en el periodo</div>
              ) : (
                <div className="divide-y divide-ink-50">
                  {consumoPorTipo.map((c) => (
                    <div key={c.tipo} className="px-5 py-3 flex justify-between text-sm">
                      <span className="text-ink-900">{TIPOS_INV_LABEL[c.tipo] ?? c.tipo}</span>
                      <span className="font-semibold text-ink-900">{c.cantidad} unidades</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Mermas */}
              <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-ink-100 flex justify-between">
                  <h2 className="font-semibold text-ink-900">Mermas</h2>
                  {totalMermasCosto > 0 && (
                    <span className="text-sm font-semibold text-danger">{formatearPrecio(totalMermasCosto)}</span>
                  )}
                </div>
                {mermas.length === 0 ? (
                  <div className="py-8 text-center text-ink-500 text-sm">Sin mermas en el periodo</div>
                ) : (
                  <div className="divide-y divide-ink-50">
                    {mermas.map((m) => (
                      <div key={m.nombre} className="px-5 py-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-ink-900">{m.nombre}</p>
                          <p className="text-xs text-ink-500">{m.cantidad} unidades</p>
                        </div>
                        <span className="text-danger font-semibold">{formatearPrecio(m.costo_total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rotación */}
              <div className="space-y-4">
                <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-ink-100">
                    <h3 className="text-sm font-semibold text-ink-900">Mayor rotación</h3>
                  </div>
                  {masRotacion.length === 0 ? (
                    <div className="py-6 text-center text-ink-500 text-sm">Sin movimientos</div>
                  ) : (
                    <div className="divide-y divide-ink-50">
                      {masRotacion.slice(0, 5).map((r) => (
                        <div key={r.nombre} className="px-5 py-2.5 flex justify-between text-sm">
                          <span className="text-ink-900 truncate">{r.nombre}</span>
                          <span className="text-ink-600 flex-shrink-0 ml-2">{r.movimientos} mov.</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-ink-100">
                    <h3 className="text-sm font-semibold text-ink-900">Sin movimiento</h3>
                  </div>
                  {sinRotacion.length === 0 ? (
                    <div className="py-6 text-center text-ink-500 text-sm">Todos con movimientos</div>
                  ) : (
                    <div className="divide-y divide-ink-50">
                      {sinRotacion.map((r) => (
                        <div key={r.nombre} className="px-5 py-2.5 text-sm text-ink-600">{r.nombre}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Días sin reabastecer */}
            {alertasDiasSinEntrada.length > 0 && (
              <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-ink-100">
                  <h2 className="font-semibold text-ink-900">Ítems en alerta — días sin reabastecer</h2>
                  <p className="text-xs text-ink-500 mt-0.5">Días desde el último movimiento de entrada</p>
                </div>
                <div className="divide-y divide-ink-50">
                  {alertasDiasSinEntrada.map((a) => (
                    <div key={a.id} className="px-5 py-3 flex justify-between text-sm">
                      <span className="text-ink-900">{a.nombre}</span>
                      <span className={`font-semibold ${a.dias_sin_entrada != null && a.dias_sin_entrada > 7 ? "text-danger" : "text-ink-900"}`}>
                        {a.dias_sin_entrada != null ? `${a.dias_sin_entrada} días` : "Nunca reabastecido"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Producción */}
            <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-ink-100">
                <h2 className="font-semibold text-ink-900">Producción registrada</h2>
                <p className="text-xs text-ink-500 mt-0.5">Producto terminado registrado como producción en el periodo</p>
              </div>
              {produccion.length === 0 ? (
                <div className="py-10 text-center text-ink-500 text-sm">Sin producción registrada en el periodo</div>
              ) : (
                <div className="divide-y divide-ink-50">
                  {produccion.map((p) => (
                    <div key={p.nombre} className="px-5 py-3 flex justify-between text-sm">
                      <span className="text-ink-900">{p.nombre}</span>
                      <span className="font-semibold text-ink-900">{p.cantidad} unidades</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
  );
}
