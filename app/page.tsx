import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import GraficoLinea from "@/components/GraficoLinea";
import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import { hoyStr, toDbDate, addDias } from "@/lib/analiticas/periodos";

export const dynamic = "force-dynamic";

const ESTADOS_CONFIG: Record<string, { label: string; color: string }> = {
  pendiente:   { label: "Pendiente",   color: "bg-yellow-100 text-yellow-700" },
  en_proceso:  { label: "En proceso",  color: "bg-blue-100 text-blue-700" },
  confirmado:  { label: "Confirmado",  color: "bg-emerald-100 text-emerald-700" },
  cancelado:   { label: "Cancelado",   color: "bg-red-100 text-red-700" },
  entregado:   { label: "Entregado",   color: "bg-gray-100 text-gray-600" },
};

const TIPOS_INV: Record<string, string> = {
  insumo: "Insumo",
  materia_prima: "Materia prima",
  producto_terminado: "Prod. terminado",
};

type FilaVentas = { fecha: Date; total: number };
type AlertaRow = {
  id: string;
  nombre: string;
  tipo: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
};

export default async function HomePage() {
  const hoy = hoyStr();
  const dbHoy = toDbDate(hoy);
  const hace6dias = addDias(hoy, -6);

  const [resumenHoy, pedidosPorEstado, pedidosClientes, ventas7d, alertas] =
    await Promise.all([
      prisma.pedidos.aggregate({
        where: { fecha_pedido: dbHoy },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.pedidos.groupBy({
        by: ["estado"],
        where: { fecha_pedido: dbHoy },
        _count: { id: true },
      }),
      prisma.pedidos.findMany({
        where: { fecha_pedido: dbHoy },
        select: { cliente_id: true },
      }),
      prisma.$queryRaw<FilaVentas[]>`
        SELECT fecha_pedido AS fecha, CAST(SUM(total) AS FLOAT) AS total
        FROM pedidos
        WHERE fecha_pedido >= ${toDbDate(hace6dias)}
          AND fecha_pedido <= ${dbHoy}
        GROUP BY fecha_pedido
        ORDER BY fecha_pedido
      `,
      prisma.$queryRaw<AlertaRow[]>`
        SELECT id::text, nombre, tipo, unidad,
               CAST(stock_actual AS FLOAT) AS stock_actual,
               CAST(stock_minimo AS FLOAT) AS stock_minimo
        FROM inventario_items
        WHERE activo = true AND stock_actual <= stock_minimo
        ORDER BY (CAST(stock_actual AS FLOAT) / NULLIF(CAST(stock_minimo AS FLOAT), 0)) ASC
        LIMIT 5
      `,
    ]);

  const ventasHoy = Number(resumenHoy._sum.total ?? 0);
  const pedidosHoy = resumenHoy._count.id;
  const clientesHoy = new Set(pedidosClientes.map((p) => p.cliente_id)).size;

  // Rellenar días sin ventas con 0
  const datosGrafico = Array.from({ length: 7 }, (_, i) => {
    const fechaStr = addDias(hace6dias, i);
    const fila = ventas7d.find((v) => v.fecha.toISOString().split("T")[0] === fechaStr);
    const [yy, mm, dd] = fechaStr.split("-").map(Number);
    const label = new Date(Date.UTC(yy, mm - 1, dd)).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    return { fecha: fechaStr, label, total: fila ? fila.total : 0 };
  });

  const accesosRapidos = [
    { href: "/pedidos", label: "Pedidos", desc: "Ver y gestionar pedidos del día", emoji: "🛒" },
    { href: "/clientes", label: "Clientes", desc: "Base de clientes y precios", emoji: "👥" },
    { href: "/inventarios", label: "Inventarios", desc: "Control de existencias y alertas", emoji: "📦" },
    { href: "/analiticas", label: "Analíticas", desc: "Ventas, clientes y tendencias", emoji: "📊" },
  ];

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pt-[72px] px-4 pb-8 lg:pt-8 lg:pb-10 lg:px-8 lg:ml-[240px]">

        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Resumen del día</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {(() => {
              const [yH, mH, dH] = hoy.split("-").map(Number);
              return new Date(Date.UTC(yH, mH - 1, dH)).toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              });
            })()}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Ventas de hoy</p>
            <p className="text-3xl font-bold text-gray-900">{formatearPrecio(ventasHoy)}</p>
            <p className="text-xs text-gray-400 mt-1">total facturado</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Pedidos de hoy</p>
            <p className="text-3xl font-bold text-gray-900">{pedidosHoy}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {pedidosPorEstado.map((e) => {
                const cfg = ESTADOS_CONFIG[e.estado] ?? { label: e.estado, color: "bg-gray-100 text-gray-600" };
                return (
                  <span key={e.estado} className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                    {e._count.id} {cfg.label}
                  </span>
                );
              })}
              {pedidosPorEstado.length === 0 && (
                <span className="text-xs text-gray-400">Sin pedidos registrados</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Clientes atendidos</p>
            <p className="text-3xl font-bold text-gray-900">{clientesHoy}</p>
            <p className="text-xs text-gray-400 mt-1">con pedido hoy</p>
          </div>
        </div>

        {/* Gráfico 7 días */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Ventas — últimos 7 días</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Total: {formatearPrecio(datosGrafico.reduce((s, d) => s + d.total, 0))}
              </p>
            </div>
            <Link href="/analiticas?tab=ventas" className="text-xs text-brand hover:underline">
              Ver analíticas →
            </Link>
          </div>
          <GraficoLinea datos={datosGrafico} altura={200} />
        </div>

        {/* Alertas + Accesos rápidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Alertas de inventario */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Alertas de inventario
                {alertas.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                    {alertas.length}
                  </span>
                )}
              </h2>
              <Link href="/inventarios" className="text-xs text-brand hover:underline">
                Ver todo →
              </Link>
            </div>
            {alertas.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Stock suficiente en todos los ítems
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {alertas.map((a) => (
                  <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {TIPOS_INV[a.tipo] ?? a.tipo} · {a.stock_actual} {a.unidad} (mín: {a.stock_minimo})
                      </p>
                    </div>
                    <span className="ml-3 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">
                      Bajo stock
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accesos rápidos */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Acceso rápido</h2>
            </div>
            <div className="grid grid-cols-2 gap-px bg-gray-100">
              {accesosRapidos.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="bg-white px-4 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-2xl block mb-2">{a.emoji}</span>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-brand transition-colors">
                    {a.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{a.desc}</p>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
