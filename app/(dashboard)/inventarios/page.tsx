import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import BadgeStock from "./BadgeStock";

export const dynamic = "force-dynamic";

const TIPOS_CONFIG = [
  { tipo: "insumo", label: "Insumos", href: "/inventarios/insumos", emoji: "📦" },
  { tipo: "materia_prima", label: "Materias primas", href: "/inventarios/materias-primas", emoji: "🥩" },
  { tipo: "producto_terminado", label: "Producto terminado", href: "/inventarios/producto-terminado", emoji: "🏷️" },
] as const;

export default async function InventariosPage() {
  const items = await prisma.inventario_items.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, tipo: true, unidad: true, stock_actual: true, stock_minimo: true, costo_unitario: true },
  });

  const resumen = TIPOS_CONFIG.map(({ tipo, label, href, emoji }) => {
    const del_tipo = items.filter((i) => i.tipo === tipo);
    const bajo_stock = del_tipo.filter((i) => Number(i.stock_actual) <= Number(i.stock_minimo));
    const valor_total = del_tipo.reduce((s, i) => s + Number(i.stock_actual) * Number(i.costo_unitario), 0);
    return { tipo, label, href, emoji, total: del_tipo.length, bajo_stock: bajo_stock.length, valor_total };
  });

  const alertas = items
    .filter((i) => Number(i.stock_actual) <= Number(i.stock_minimo))
    .map((i) => ({ ...i, stock_actual: Number(i.stock_actual), stock_minimo: Number(i.stock_minimo) }));

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Inventarios</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen general de existencias</p>
        </div>
        <Link href="/inventarios/movimientos"
          className="h-11 px-3 lg:px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 flex-shrink-0">
          Historial de movimientos
        </Link>
      </div>

      {/* Tarjetas por tipo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {resumen.map((r) => (
          <Link key={r.tipo} href={r.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{r.emoji}</span>
              <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors">{r.label}</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total ítems</span>
                <span className="font-medium text-gray-900">{r.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bajo stock</span>
                <span className={`font-medium ${r.bajo_stock > 0 ? "text-red-600" : "text-green-600"}`}>
                  {r.bajo_stock}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valor total</span>
                <span className="font-medium text-gray-900">{formatearPrecio(r.valor_total)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alertas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            Alertas de stock
            {alertas.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">{alertas.length}</span>
            )}
          </h3>
        </div>
        {alertas.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">Todos los ítems tienen stock suficiente</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {alertas.map((a) => (
              <div key={a.id} className="px-4 sm:px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {TIPOS_CONFIG.find((t) => t.tipo === a.tipo)?.label} · {a.stock_actual} {a.unidad} (mín: {a.stock_minimo})
                  </p>
                </div>
                <BadgeStock actual={a.stock_actual} minimo={a.stock_minimo} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
