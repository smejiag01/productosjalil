import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import {
  calcularRango,
  hoyStr,
  toDbDate,
  toUtcInicioTs,
  toUtcFinTs,
  addDias,
} from "@/lib/analiticas/periodos";
import type { Periodo } from "@/lib/analiticas/periodos";
import SelectorPeriodo from "./SelectorPeriodo";
import GraficoLinea from "@/components/GraficoLinea";
import GraficoBarras from "@/components/GraficoBarras";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "ventas",     label: "Ventas" },
  { key: "pedidos",    label: "Pedidos" },
  { key: "productos",  label: "Productos" },
  { key: "clientes",   label: "Clientes" },
  { key: "inventario", label: "Inventario" },
];

const ESTADOS_COLORES: Record<string, string> = {
  pendiente:  "#f59e0b",
  en_proceso: "#3b82f6",
  confirmado: "#10b981",
  cancelado:  "#ef4444",
  entregado:  "#6b7280",
};

const ESTADOS_LABELS: Record<string, string> = {
  pendiente:  "Pendiente",
  en_proceso: "En proceso",
  confirmado: "Confirmado",
  cancelado:  "Cancelado",
  entregado:  "Entregado",
};

const TIPOS_INV_LABEL: Record<string, string> = {
  insumo: "Insumos",
  materia_prima: "Materias primas",
  producto_terminado: "Prod. terminado",
};

const DIAS_INACTIVIDAD = 14;

type FilaVentas   = { fecha: Date; total: number };
type FilaEstado   = { fecha: Date; estado: string; count: number };
type FilaProducto = { nombre: string; cantidad: number; ingresos: number };
type FilaCliente  = { nombre: string; pedidos: number; total: number };
type FilaInactivo = { nombre: string; dias: number | null };
type FilaConsumo  = { tipo: string; cantidad: number };
type FilaMerma    = { nombre: string; cantidad: number; costo_total: number };
type FilaRotacion = { nombre: string; movimientos: number };

function diffDias(a: string, b: string): number {
  return (toDbDate(b).getTime() - toDbDate(a).getTime()) / 86400000;
}

export default async function AnaliticasPage({
  searchParams,
}: {
  searchParams: {
    periodo?: string;
    fecha?: string;
    tab?: string;
  };
}) {
  const periodo = (
    ["diario", "semanal", "quincenal", "mensual"].includes(searchParams.periodo ?? "")
      ? searchParams.periodo
      : "semanal"
  ) as Periodo;

  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.fecha ?? "")
    ? searchParams.fecha!
    : hoyStr();

  const tab = TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab! : "ventas";

  const rango = calcularRango(periodo, fecha);
  const inicioDb  = toDbDate(rango.inicio);
  const finDb     = toDbDate(rango.fin);
  const inicioAntDb = toDbDate(rango.inicioAnterior);
  const finAntDb    = toDbDate(rango.finAnterior);
  const inicioTs  = toUtcInicioTs(rango.inicio);
  const finTs     = toUtcFinTs(rango.fin);

  // ── Ventas ──────────────────────────────────────────────────────────────
  let serieVentas: { fecha: string; label: string; total: number }[] = [];
  let totalVentas = 0, totalAnterior = 0, ticketPromedio = 0, variacion = 0, totalPedidosVentas = 0;

  if (tab === "ventas") {
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
  }

  // ── Pedidos ─────────────────────────────────────────────────────────────
  let totalPedidos = 0, cancelados = 0, tasaCancelacion = 0;
  let porEstado: { estado: string; count: number }[] = [];
  let seriePedidos: Record<string, string | number>[] = [];

  if (tab === "pedidos") {
    const [estadosRaw, serieRaw] = await Promise.all([
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
    ]);
    porEstado = estadosRaw.map((e) => ({ estado: e.estado, count: e._count.id }));
    totalPedidos = porEstado.reduce((s, r) => s + r.count, 0);
    cancelados = porEstado.find((r) => r.estado === "cancelado")?.count ?? 0;
    tasaCancelacion = totalPedidos > 0 ? Math.round((cancelados / totalPedidos) * 1000) / 10 : 0;
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
  }

  // ── Productos ────────────────────────────────────────────────────────────
  let topProductos: FilaProducto[] = [];
  let bajaRotacion: { nombre: string; cantidad: number }[] = [];

  if (tab === "productos") {
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
  }

  // ── Clientes ─────────────────────────────────────────────────────────────
  let masActivos: FilaCliente[] = [];
  let clientesNuevos = 0;
  let inactivos: FilaInactivo[] = [];

  if (tab === "clientes") {
    [masActivos, clientesNuevos, inactivos] = await Promise.all([
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
        HAVING MAX(p.fecha_pedido) < NOW() - make_interval(days => ${DIAS_INACTIVIDAD})
            OR MAX(p.fecha_pedido) IS NULL
        ORDER BY dias DESC NULLS LAST LIMIT 10
      `,
    ]);
  }

  // ── Inventario ───────────────────────────────────────────────────────────
  let consumoPorTipo: FilaConsumo[] = [];
  let mermas: FilaMerma[] = [];
  let totalMermasCosto = 0;
  let masRotacion: FilaRotacion[] = [];
  let sinRotacion: { nombre: string }[] = [];

  if (tab === "inventario") {
    [consumoPorTipo, mermas, masRotacion, sinRotacion] = await Promise.all([
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
    ]);
    totalMermasCosto = mermas.reduce((s, m) => s + m.costo_total, 0);
  }

  function tabUrl(t: string) {
    return `/analiticas?periodo=${periodo}&fecha=${fecha}&tab=${t}`;
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Analíticas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{rango.label}</p>
        </div>
      </div>

      {/* Selector de periodo */}
      <SelectorPeriodo periodo={periodo} fecha={fecha} navLabel={rango.navLabel} tab={tab} />

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-gray-100 rounded-lg p-0.5 mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabUrl(t.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── VENTAS ─────────────────────────────────────────────────────────── */}
      {tab === "ventas" && (
        <div className="space-y-6">
          {/* Métricas clave */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Total del periodo</p>
              <p className="text-3xl font-bold text-gray-900">{formatearPrecio(totalVentas)}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-sm font-semibold ${variacion >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {variacion >= 0 ? "↑" : "↓"} {Math.abs(Math.round(variacion * 10) / 10)}%
                </span>
                <span className="text-xs text-gray-400">vs. periodo anterior</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Ticket promedio</p>
              <p className="text-3xl font-bold text-gray-900">{formatearPrecio(ticketPromedio)}</p>
              <p className="text-xs text-gray-400 mt-1">{totalPedidosVentas} pedidos en el periodo</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Periodo anterior</p>
              <p className="text-3xl font-bold text-gray-400">{formatearPrecio(totalAnterior)}</p>
              <p className="text-xs text-gray-400 mt-1 capitalize">{calcularRango(periodo, rango.inicioAnterior).navLabel}</p>
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Ventas por día</h2>
            <GraficoLinea datos={serieVentas} altura={240} />
          </div>
        </div>
      )}

      {/* ── PEDIDOS ────────────────────────────────────────────────────────── */}
      {tab === "pedidos" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Total pedidos</p>
              <p className="text-3xl font-bold text-gray-900">{totalPedidos}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Tasa de cancelación</p>
              <p className={`text-3xl font-bold ${tasaCancelacion > 10 ? "text-red-600" : "text-gray-900"}`}>
                {tasaCancelacion}%
              </p>
              <p className="text-xs text-gray-400 mt-1">{cancelados} cancelados</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-2">Por estado</p>
              <div className="space-y-1">
                {porEstado.map((e) => (
                  <div key={e.estado} className="flex justify-between text-sm">
                    <span className="text-gray-600">{ESTADOS_LABELS[e.estado] ?? e.estado}</span>
                    <span className="font-semibold text-gray-900">{e.count}</span>
                  </div>
                ))}
                {porEstado.length === 0 && <p className="text-sm text-gray-400">Sin datos</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Pedidos por día</h2>
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
        </div>
      )}

      {/* ── PRODUCTOS ──────────────────────────────────────────────────────── */}
      {tab === "productos" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Top 10 productos más vendidos</h2>
            </div>
            {topProductos.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Sin datos para este periodo</div>
            ) : (
              <>
                {/* Cards móvil */}
                <div className="lg:hidden divide-y divide-gray-50">
                  {topProductos.map((p, i) => (
                    <div key={p.nombre} className="px-5 py-3 flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-300 w-6 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.cantidad} unidades</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{formatearPrecio(p.ingresos)}</span>
                    </div>
                  ))}
                </div>
                {/* Tabla desktop */}
                <table className="w-full hidden lg:table">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase w-8">#</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topProductos.map((p, i) => (
                      <tr key={p.nombre} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-sm text-gray-400">{i + 1}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{p.nombre}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right">{p.cantidad}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">{formatearPrecio(p.ingresos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {bajaRotacion.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Productos con baja rotación</h2>
                <p className="text-xs text-gray-400 mt-0.5">Menos de 2 unidades vendidas en el periodo</p>
              </div>
              <div className="divide-y divide-gray-50">
                {bajaRotacion.map((p) => (
                  <div key={p.nombre} className="px-5 py-3 flex justify-between text-sm">
                    <span className="text-gray-900">{p.nombre}</span>
                    <span className="text-gray-400">{p.cantidad} und.</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CLIENTES ───────────────────────────────────────────────────────── */}
      {tab === "clientes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Más activos */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Clientes más activos</h2>
              </div>
              {masActivos.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">Sin datos para este periodo</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {masActivos.map((c, i) => (
                    <div key={c.nombre} className="px-5 py-3 flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-300 w-5 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.nombre}</p>
                        <p className="text-xs text-gray-400">{c.pedidos} {c.pedidos === 1 ? "pedido" : "pedidos"}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{formatearPrecio(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Clientes nuevos */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500 mb-1">Clientes nuevos</p>
                <p className="text-3xl font-bold text-gray-900">{clientesNuevos}</p>
                <p className="text-xs text-gray-400 mt-1">registrados en el periodo</p>
              </div>

              {/* Inactivos */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Sin pedido reciente
                    <span className="ml-1 text-xs font-normal text-gray-400">(+{DIAS_INACTIVIDAD} días)</span>
                  </h3>
                </div>
                {inactivos.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 text-sm">Todos activos</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {inactivos.map((c) => (
                      <div key={c.nombre} className="px-5 py-2.5 flex justify-between text-sm">
                        <span className="text-gray-900 truncate">{c.nombre}</span>
                        <span className="text-gray-400 flex-shrink-0 ml-2">
                          {c.dias != null ? `${c.dias} días` : "Nunca"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INVENTARIO ─────────────────────────────────────────────────────── */}
      {tab === "inventario" && (
        <div className="space-y-6">
          {/* Consumo por tipo */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Consumo por tipo (salidas)</h2>
            </div>
            {consumoPorTipo.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Sin movimientos de salida en el periodo</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {consumoPorTipo.map((c) => (
                  <div key={c.tipo} className="px-5 py-3 flex justify-between text-sm">
                    <span className="text-gray-900">{TIPOS_INV_LABEL[c.tipo] ?? c.tipo}</span>
                    <span className="font-semibold text-gray-900">{c.cantidad} unidades</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Mermas */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between">
                <h2 className="font-semibold text-gray-900">Mermas</h2>
                {totalMermasCosto > 0 && (
                  <span className="text-sm font-semibold text-red-600">{formatearPrecio(totalMermasCosto)}</span>
                )}
              </div>
              {mermas.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">Sin mermas en el periodo</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {mermas.map((m) => (
                    <div key={m.nombre} className="px-5 py-3 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{m.nombre}</p>
                        <p className="text-xs text-gray-400">{m.cantidad} unidades</p>
                      </div>
                      <span className="text-red-600 font-semibold">{formatearPrecio(m.costo_total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rotación */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Mayor rotación</h3>
                </div>
                {masRotacion.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 text-sm">Sin movimientos</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {masRotacion.slice(0, 5).map((r) => (
                      <div key={r.nombre} className="px-5 py-2.5 flex justify-between text-sm">
                        <span className="text-gray-900 truncate">{r.nombre}</span>
                        <span className="text-gray-500 flex-shrink-0 ml-2">{r.movimientos} mov.</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Sin movimiento</h3>
                </div>
                {sinRotacion.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 text-sm">Todos con movimientos</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {sinRotacion.map((r) => (
                      <div key={r.nombre} className="px-5 py-2.5 text-sm text-gray-500">{r.nombre}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
