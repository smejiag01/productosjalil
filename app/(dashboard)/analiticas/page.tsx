import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import {
  calcularRango,
  calcularRangoPersonalizado,
  hoyStr,
  toDbDate,
  toUtcInicioTs,
  toUtcFinTs,
  addDias,
  fmtShort,
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
  { key: "rutas",      label: "Rutas" },
];

const ESTADOS_COLORES: Record<string, string> = {
  pendiente:  "#f59e0b",
  en_proceso: "#3b82f6",
  confirmado: "#10b981",
  en_reparto: "#8b5cf6",
  cancelado:  "#ef4444",
  entregado:  "#6b7280",
  devuelto:   "#f97316",
};

const ESTADOS_LABELS: Record<string, string> = {
  pendiente:  "Pendiente",
  en_proceso: "En proceso",
  confirmado: "Confirmado",
  en_reparto: "En reparto",
  cancelado:  "Cancelado",
  entregado:  "Entregado",
  devuelto:   "Devuelto",
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
type FilaProduccion = { nombre: string; cantidad: number };
type FilaClientePrecio = { con_precio: number; sin_precio: number };
type FilaVentasRuta = { ruta: string; pedidos: number; total: number };
type FilaDevolucionRuta = { ruta: string; devueltos: number; total: number };
type FilaTiempoRuta = { ruta: string; horas_promedio: number | null };
type FilaRepartidor = { repartidor: string; entregados: number; devueltos: number };
type FilaTiempo = { horas_promedio: number | null };
type FilaHoraPico = { hora: number; total: number };
type FilaBucket = { bucket: string; total: number };
type FilaFrecuencia = { frecuencia_promedio: number | null };
type FilaRetencion = { anterior_total: number; retenidos: number };
type FilaMultiSede = { multi_sede: number };
type FilaAlertaDias = { id: string; nombre: string; dias_sin_entrada: number | null };

const ORDEN_BUCKETS = ["<1h", "1-3h", "3-6h", "+6h"];
const LABELS_BUCKETS: Record<string, string> = {
  "<1h": "Menos de 1h",
  "1-3h": "1 a 3h",
  "3-6h": "3 a 6h",
  "+6h": "Más de 6h",
};

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
    desde?: string;
    hasta?: string;
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

  const fechaValida = (s?: string) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? "");
  const esPersonalizado =
    searchParams.periodo === "personalizado" &&
    fechaValida(searchParams.desde) &&
    fechaValida(searchParams.hasta);

  // Valores por defecto para los inputs de rango libre: si aún no hay uno
  // elegido, se sugieren los últimos 7 días para que el usuario parta de algo.
  const desdeParam = fechaValida(searchParams.desde) ? searchParams.desde! : addDias(fecha, -6);
  const hastaParam = fechaValida(searchParams.hasta) ? searchParams.hasta! : fecha;

  const rango = esPersonalizado
    ? calcularRangoPersonalizado(desdeParam, hastaParam)
    : calcularRango(periodo, fecha);
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
  let horasConfirmacion: number | null = null;
  let horasTotalPedido: number | null = null;
  let valorPerdidoDevoluciones = 0;
  let pedidosPorHora: { label: string; total: number }[] = [];

  if (tab === "pedidos") {
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
  let ventasPorRutaClientes: FilaVentasRuta[] = [];
  let clientesConPrecio = 0;
  let clientesSinPrecio = 0;
  let frecuenciaPromedio: number | null = null;
  let tasaRetencion: number | null = null;
  let clientesRetenidos = 0;
  let clientesAnteriorTotal = 0;
  let clientesMultiSede = 0;

  if (tab === "clientes") {
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
  }

  // ── Inventario ───────────────────────────────────────────────────────────
  let consumoPorTipo: FilaConsumo[] = [];
  let mermas: FilaMerma[] = [];
  let totalMermasCosto = 0;
  let masRotacion: FilaRotacion[] = [];
  let sinRotacion: { nombre: string }[] = [];
  let produccion: FilaProduccion[] = [];
  let alertasDiasSinEntrada: FilaAlertaDias[] = [];

  if (tab === "inventario") {
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
  }

  // ── Rutas ────────────────────────────────────────────────────────────────
  let ventasPorRuta: FilaVentasRuta[] = [];
  let devolucionPorRuta: FilaDevolucionRuta[] = [];
  let tiempoPorRuta: FilaTiempoRuta[] = [];
  let rankingRepartidores: FilaRepartidor[] = [];
  let distribucionTiempos: { label: string; total: number }[] = [];

  if (tab === "rutas") {
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
  }

  function tabUrl(t: string) {
    return esPersonalizado
      ? `/analiticas?periodo=personalizado&desde=${desdeParam}&hasta=${hastaParam}&tab=${t}`
      : `/analiticas?periodo=${periodo}&fecha=${fecha}&tab=${t}`;
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
      <SelectorPeriodo
        periodo={periodo}
        fecha={fecha}
        navLabel={rango.navLabel}
        tab={tab}
        esPersonalizado={esPersonalizado}
        desde={desdeParam}
        hasta={hastaParam}
      />

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
              <p className="text-xs text-gray-400 mt-1 capitalize">
                {esPersonalizado
                  ? `${fmtShort(rango.inicioAnterior)} – ${fmtShort(rango.finAnterior)}`
                  : calcularRango(periodo, rango.inicioAnterior).navLabel}
              </p>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Tiempo promedio de confirmación</p>
              <p className="text-3xl font-bold text-gray-900">
                {horasConfirmacion != null ? `${Math.round(horasConfirmacion * 10) / 10} h` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1">desde que se crea hasta que se confirma</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Tiempo total del pedido</p>
              <p className="text-3xl font-bold text-gray-900">
                {horasTotalPedido != null ? `${Math.round(horasTotalPedido * 10) / 10} h` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1">desde que se crea hasta que se entrega</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Valor perdido en devoluciones</p>
              <p className={`text-3xl font-bold ${valorPerdidoDevoluciones > 0 ? "text-red-600" : "text-gray-900"}`}>
                {formatearPrecio(valorPerdidoDevoluciones)}
              </p>
              <p className="text-xs text-gray-400 mt-1">total de pedidos devueltos en el periodo</p>
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

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Pedidos por hora del día</h2>
            <GraficoBarras
              datos={pedidosPorHora}
              claves={[{ key: "total", color: "#3b82f6", label: "Pedidos" }]}
              altura={220}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ventas por ruta */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Ventas por ruta</h2>
              </div>
              {ventasPorRutaClientes.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">Sin datos para este periodo</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {ventasPorRutaClientes.map((r) => (
                    <div key={r.ruta} className="px-5 py-3 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{r.ruta}</p>
                        <p className="text-xs text-gray-400">{r.pedidos} {r.pedidos === 1 ? "pedido" : "pedidos"}</p>
                      </div>
                      <span className="font-semibold text-gray-900">{formatearPrecio(r.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Precios personalizados */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-3">Clientes con precio personalizado</p>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{clientesConPrecio}</p>
                  <p className="text-xs text-gray-400 mt-1">con al menos un precio propio</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-400">{clientesSinPrecio}</p>
                  <p className="text-xs text-gray-400 mt-1">usan solo el precio base</p>
                </div>
              </div>
              {clientesConPrecio + clientesSinPrecio > 0 && (
                <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand"
                    style={{ width: `${Math.round((clientesConPrecio / (clientesConPrecio + clientesSinPrecio)) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Frecuencia promedio de pedido</p>
              <p className="text-3xl font-bold text-gray-900">
                {frecuenciaPromedio != null ? `${Math.round(frecuenciaPromedio)} días` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1">entre un pedido y el siguiente (histórico)</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Retención vs. periodo anterior</p>
              <p className="text-3xl font-bold text-gray-900">
                {tasaRetencion != null ? `${tasaRetencion}%` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {clientesAnteriorTotal > 0
                  ? `${clientesRetenidos} de ${clientesAnteriorTotal} volvieron a pedir`
                  : "sin pedidos en el periodo anterior"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Clientes con más de una sede</p>
              <p className="text-3xl font-bold text-gray-900">{clientesMultiSede}</p>
              <p className="text-xs text-gray-400 mt-1">negocios con varios puntos de entrega</p>
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

          {/* Días sin reabastecer */}
          {alertasDiasSinEntrada.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Ítems en alerta — días sin reabastecer</h2>
                <p className="text-xs text-gray-400 mt-0.5">Días desde el último movimiento de entrada</p>
              </div>
              <div className="divide-y divide-gray-50">
                {alertasDiasSinEntrada.map((a) => (
                  <div key={a.id} className="px-5 py-3 flex justify-between text-sm">
                    <span className="text-gray-900">{a.nombre}</span>
                    <span className={`font-semibold ${a.dias_sin_entrada != null && a.dias_sin_entrada > 7 ? "text-red-600" : "text-gray-900"}`}>
                      {a.dias_sin_entrada != null ? `${a.dias_sin_entrada} días` : "Nunca reabastecido"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Producción */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Producción registrada</h2>
              <p className="text-xs text-gray-400 mt-0.5">Producto terminado registrado como producción en el periodo</p>
            </div>
            {produccion.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Sin producción registrada en el periodo</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {produccion.map((p) => (
                  <div key={p.nombre} className="px-5 py-3 flex justify-between text-sm">
                    <span className="text-gray-900">{p.nombre}</span>
                    <span className="font-semibold text-gray-900">{p.cantidad} unidades</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RUTAS ──────────────────────────────────────────────────────────── */}
      {tab === "rutas" && (
        <div className="space-y-6">
          {/* Ventas por ruta */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Ventas por ruta</h2>
            <GraficoBarras
              datos={ventasPorRuta.map((r) => ({ label: r.ruta, total: r.total }))}
              claves={[{ key: "total", color: "#8B1A1A", label: "Ventas" }]}
              altura={220}
              formato="cop"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tasa de devolución por ruta */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Tasa de devolución por ruta</h2>
              </div>
              {devolucionPorRuta.every((r) => r.total === 0) ? (
                <div className="py-10 text-center text-gray-400 text-sm">Sin datos para este periodo</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {devolucionPorRuta.map((r) => {
                    const tasa = r.total > 0 ? Math.round((r.devueltos / r.total) * 1000) / 10 : 0;
                    return (
                      <div key={r.ruta} className="px-5 py-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{r.ruta}</p>
                          <p className="text-xs text-gray-400">{r.devueltos} de {r.total} pedidos</p>
                        </div>
                        <span className={`font-semibold ${tasa > 10 ? "text-red-600" : "text-gray-900"}`}>
                          {tasa}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tiempo promedio de entrega por ruta */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Tiempo promedio de entrega</h2>
                <p className="text-xs text-gray-400 mt-0.5">Desde confirmado hasta entregado</p>
              </div>
              {tiempoPorRuta.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">Sin entregas completadas en el periodo</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {tiempoPorRuta.map((r) => (
                    <div key={r.ruta} className="px-5 py-3 flex justify-between text-sm">
                      <span className="text-gray-900">{r.ruta}</span>
                      <span className="font-semibold text-gray-900">
                        {r.horas_promedio != null ? `${Math.round(r.horas_promedio * 10) / 10} h` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Distribución de tiempos de entrega */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Distribución de tiempos de entrega</h2>
            <p className="text-xs text-gray-400 mb-4">Todas las rutas, desde confirmado hasta entregado</p>
            <GraficoBarras
              datos={distribucionTiempos}
              claves={[{ key: "total", color: "#8b5cf6", label: "Pedidos" }]}
              altura={200}
              formato="numero"
            />
          </div>

          {/* Ranking de repartidores */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Ranking de repartidores</h2>
            </div>
            {rankingRepartidores.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Sin entregas en el periodo</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {rankingRepartidores.map((r, i) => {
                  const totalR = r.entregados + r.devueltos;
                  const tasaDev = totalR > 0 ? Math.round((r.devueltos / totalR) * 1000) / 10 : 0;
                  return (
                    <div key={r.repartidor} className="px-5 py-3 flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-300 w-5 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.repartidor}</p>
                        <p className="text-xs text-gray-400">
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
      )}
    </div>
  );
}
