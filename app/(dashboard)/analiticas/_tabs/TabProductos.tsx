import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import { type ContextoAnalitica, type FilaProducto } from "./comunes";

export default async function TabProductos({ ctx }: { ctx: ContextoAnalitica }) {
  const { inicioDb, finDb } = ctx;
  let topProductos: FilaProducto[] = [];
  let bajaRotacion: { nombre: string; cantidad: number }[] = [];

    [topProductos, bajaRotacion] = await Promise.all([
      prisma.$queryRaw<FilaProducto[]>`
        SELECT pi.producto_nombre AS nombre,
               CAST(SUM(pi.cantidad) AS FLOAT) AS cantidad,
               CAST(SUM(pi.subtotal) AS FLOAT) AS ingresos
        FROM pedido_items pi JOIN pedidos p ON p.id = pi.pedido_id
        WHERE p.fecha_pedido >= ${inicioDb} AND p.fecha_pedido <= ${finDb}
        GROUP BY pi.producto_nombre ORDER BY ingresos DESC LIMIT 10
      `,
      prisma.$queryRaw<{ nombre: string; cantidad: number }[]>`
        SELECT pi.producto_nombre AS nombre,
               CAST(COALESCE(SUM(pi.cantidad), 0) AS FLOAT) AS cantidad
        FROM pedido_items pi JOIN pedidos p ON p.id = pi.pedido_id
        WHERE p.fecha_pedido >= ${inicioDb} AND p.fecha_pedido <= ${finDb}
        GROUP BY pi.producto_nombre HAVING SUM(pi.cantidad) < 2
        ORDER BY cantidad ASC LIMIT 10
      `,
    ]);

  return (
          <div className="space-y-6">
            <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-ink-100">
                <h2 className="font-semibold text-ink-900">Top 10 productos más vendidos</h2>
              </div>
              {topProductos.length === 0 ? (
                <div className="py-12 text-center text-ink-500 text-sm">Sin datos para este periodo</div>
              ) : (
                <>
                  {/* Cards móvil */}
                  <div className="lg:hidden divide-y divide-ink-50">
                    {topProductos.map((p, i) => (
                      <div key={p.nombre} className="px-5 py-3 flex items-center gap-3">
                        <span className="text-lg font-bold text-ink-300 w-6 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-900 truncate">{p.nombre}</p>
                          <p className="text-xs text-ink-500">{p.cantidad} unidades</p>
                        </div>
                        <span className="text-sm font-semibold text-ink-900 flex-shrink-0">{formatearPrecio(p.ingresos)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Tabla desktop */}
                  <table className="w-full hidden lg:table">
                    <thead>
                      <tr className="border-b border-ink-100">
                        <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase w-8">#</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Producto</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">Cantidad</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-50">
                      {topProductos.map((p, i) => (
                        <tr key={p.nombre} className="hover:bg-ink-50/50">
                          <td className="py-3 px-4 text-sm text-ink-500">{i + 1}</td>
                          <td className="py-3 px-4 text-sm font-medium text-ink-900">{p.nombre}</td>
                          <td className="py-3 px-4 text-sm text-ink-700 text-right">{p.cantidad}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-ink-900 text-right">{formatearPrecio(p.ingresos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            {bajaRotacion.length > 0 && (
              <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-ink-100">
                  <h2 className="font-semibold text-ink-900">Productos con baja rotación</h2>
                  <p className="text-xs text-ink-500 mt-0.5">Menos de 2 unidades vendidas en el periodo</p>
                </div>
                <div className="divide-y divide-ink-50">
                  {bajaRotacion.map((p) => (
                    <div key={p.nombre} className="px-5 py-3 flex justify-between text-sm">
                      <span className="text-ink-900">{p.nombre}</span>
                      <span className="text-ink-500">{p.cantidad} und.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
  );
}
