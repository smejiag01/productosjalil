import Link from "next/link";
import type { ReactNode } from "react";
import GraficoLinea from "@/components/GraficoLinea";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  ArrowRight,
  ChartColumn,
  CheckCircle2,
  MapPin,
  MessageSquareWarning,
  Package,
  ShoppingBag,
  Truck,
  Users,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import { hoyStr, toDbDate, addDias } from "@/lib/analiticas/periodos";
import { capitalizar } from "@/lib/repartidor-fechas";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inicio" };

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

const TONOS_AVISO = {
  info: { caja: "border-info/30 bg-info-soft hover:bg-info-soft/70", texto: "text-info" },
  warn: { caja: "border-warn/60 bg-warn-soft hover:bg-warn-soft/70", texto: "text-warn-soft-text" },
  danger: { caja: "border-danger/30 bg-danger-soft hover:bg-danger-soft/70", texto: "text-danger" },
} as const;

/** Aviso accionable del Inicio: un conteo y a dónde ir para resolverlo. */
function AvisoPendiente({
  href,
  tono,
  icono,
  titulo,
  valor,
  detalle,
}: {
  href: string;
  tono: keyof typeof TONOS_AVISO;
  icono: ReactNode;
  titulo: string;
  valor: number;
  detalle: string;
}) {
  const t = TONOS_AVISO[tono];
  return (
    <Link
      href={href}
      className={cn("group block rounded-card border p-4 shadow-card transition-colors sm:p-5", t.caja)}
    >
      <p className={cn("flex items-center gap-2 text-sm font-semibold", t.texto)}>
        <span aria-hidden="true">{icono}</span>
        {titulo}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-ink-900">{valor}</p>
      <p className="mt-1 text-xs text-ink-700">{detalle}</p>
    </Link>
  );
}

export default async function HomePage() {
  const hoy = hoyStr();
  const dbHoy = toDbDate(hoy);
  const hace6dias = addDias(hoy, -6);

  const [resumenHoy, pedidosPorEstado, pedidosClientes, ventas7d, alertas, rutasPorDespachar, clientesSinRuta, pqrsAbiertas] =
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
      prisma.pedidos.findMany({
        where: { fecha_pedido: dbHoy, estado: "confirmado", ruta_id: { not: null } },
        select: { ruta_id: true },
        distinct: ["ruta_id"],
      }),
      prisma.clientes.count({ where: { activo: true, ruta_id: null } }),
      prisma.pqr.count({ where: { estado: { in: ["pendiente", "en_revision"] } } }),
    ]);

  const ventasHoy = Number(resumenHoy._sum.total ?? 0);
  const pedidosHoy = resumenHoy._count.id;
  const clientesHoy = new Set(pedidosClientes.map((p) => p.cliente_id)).size;
  const numRutasPorDespachar = rutasPorDespachar.length;

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

  const [yH, mH, dH] = hoy.split("-").map(Number);
  const fechaLarga = capitalizar(
    new Date(Date.UTC(yH, mH - 1, dH)).toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })
  );

  const accesosRapidos = [
    { href: "/pedidos", label: "Pedidos", desc: "Ver y gestionar pedidos del día", Icono: ShoppingBag },
    { href: "/clientes", label: "Clientes", desc: "Base de clientes y precios", Icono: Users },
    { href: "/inventarios", label: "Inventarios", desc: "Control de existencias y alertas", Icono: Package },
    { href: "/analiticas", label: "Analíticas", desc: "Ventas, clientes y tendencias", Icono: ChartColumn },
  ];

  return (
    <div>
      <PageHeader title="Resumen del día" subtitle={fechaLarga} />

      {/* Indicadores */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Ventas de hoy"
          value={formatearPrecio(ventasHoy)}
          hint="total facturado"
          tone="brand"
          icon={<ChartColumn className="h-5 w-5" />}
        />

        <StatCard
          label="Pedidos de hoy"
          value={pedidosHoy}
          tone="brand"
          icon={<ShoppingBag className="h-5 w-5" />}
          hint={
            pedidosPorEstado.length === 0 ? (
              "Sin pedidos registrados"
            ) : (
              <span className="mt-1 flex flex-wrap gap-1.5">
                {pedidosPorEstado.map((e) => (
                  <span key={e.estado} className="inline-flex items-center gap-1">
                    <span className="text-sm font-bold tabular-nums text-ink-900">{e._count.id}</span>
                    <StatusBadge estado={e.estado} />
                  </span>
                ))}
              </span>
            )
          }
        />

        <StatCard
          label="Clientes atendidos"
          value={clientesHoy}
          hint="con pedido hoy"
          tone="brand"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Acciones pendientes */}
      {(numRutasPorDespachar > 0 || clientesSinRuta > 0 || pqrsAbiertas > 0) && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {numRutasPorDespachar > 0 && (
            <AvisoPendiente
              href="/pedidos"
              tono="info"
              icono={<Truck className="h-4 w-4" />}
              titulo="Rutas listas para despachar"
              valor={numRutasPorDespachar}
              detalle="con pedidos confirmados hoy"
            />
          )}
          {clientesSinRuta > 0 && (
            <AvisoPendiente
              href="/clientes?sinruta=1"
              tono="warn"
              icono={<MapPin className="h-4 w-4" />}
              titulo="Clientes sin ruta asignada"
              valor={clientesSinRuta}
              detalle="no reciben recordatorios ni pueden pedir en la tienda. Toca para asignarles una ruta"
            />
          )}
          {pqrsAbiertas > 0 && (
            <AvisoPendiente
              href="/pqrs"
              tono="danger"
              icono={<MessageSquareWarning className="h-4 w-4" />}
              titulo="PQR's abiertas"
              valor={pqrsAbiertas}
              detalle="pendientes + en revisión"
            />
          )}
        </div>
      )}

      {/* Gráfico 7 días */}
      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">Ventas — últimos 7 días</h2>
            <p className="mt-0.5 text-xs text-ink-600">
              Total: {formatearPrecio(datosGrafico.reduce((s, d) => s + d.total, 0))}
            </p>
          </div>
          <Link
            href="/analiticas?tab=ventas"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          >
            Ver analíticas
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <GraficoLinea datos={datosGrafico} altura={200} />
      </Card>

      {/* Alertas + Accesos rápidos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Alertas de inventario */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              Alertas de inventario
              {alertas.length > 0 && (
                <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
                  {alertas.length}
                </span>
              )}
            </h2>
            <Link
              href="/inventarios"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              Ver todo
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          {alertas.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-7 w-7" />}
              title="Stock suficiente"
              description="Todos los ítems están por encima de su mínimo."
              className="py-10"
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {alertas.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{a.nombre}</p>
                    <p className="text-xs text-ink-600">
                      {TIPOS_INV[a.tipo] ?? a.tipo} · {a.stock_actual} {a.unidad} (mín: {a.stock_minimo})
                    </p>
                  </div>
                  <span className="flex-shrink-0 rounded-full border border-danger/30 bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
                    Bajo stock
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Accesos rápidos */}
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-ink-200 px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-ink-900">Acceso rápido</h2>
          </div>
          <div className="grid grid-cols-2 gap-px bg-ink-200">
            {accesosRapidos.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group bg-white px-4 py-4 transition-colors hover:bg-brand-50"
              >
                <span
                  aria-hidden="true"
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-control bg-brand-50 text-brand-700 group-hover:bg-white"
                >
                  <a.Icono className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-ink-900">{a.label}</p>
                <p className="mt-0.5 text-xs leading-snug text-ink-600">{a.desc}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
