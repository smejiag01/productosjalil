import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatearFechaHora, inicioDelDiaBogota, finDelDiaBogota } from "@/lib/fechas";
import { INVENTARIO_MATERIA_PRIMA_HABILITADO } from "@/lib/inventario-flags";
import TablaMovimientos from "./TablaMovimientos";

export const dynamic = "force-dynamic";

const LABELS_TIPO: Record<string, string> = {
  insumo: "Insumo",
  materia_prima: "Materia prima",
  producto_terminado: "Prod. terminado",
};

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: { tipo_inventario?: string; tipo_movimiento?: string; desde?: string; hasta?: string; pagina?: string };
}) {
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) notFound();

  const pagina = Math.max(1, parseInt(searchParams.pagina || "1"));
  const porPagina = 20;

  const where: Record<string, unknown> = {};
  if (searchParams.tipo_movimiento) where.tipo = searchParams.tipo_movimiento;
  if (searchParams.tipo_inventario) where.item = { tipo: searchParams.tipo_inventario };
  if (searchParams.desde || searchParams.hasta) {
    const fechaFiltro: Record<string, Date> = {};
    if (searchParams.desde) fechaFiltro.gte = inicioDelDiaBogota(searchParams.desde);
    if (searchParams.hasta) fechaFiltro.lte = finDelDiaBogota(searchParams.hasta);
    where.created_at = fechaFiltro;
  }

  const [movimientos, total] = await Promise.all([
    prisma.inventario_movimientos.findMany({
      where,
      include: {
        item: { select: { nombre: true, tipo: true, unidad: true } },
        usuario: { select: { nombre: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.inventario_movimientos.count({ where }),
  ]);

  const totalPaginas = Math.ceil(total / porPagina);

  const serializados = movimientos.map((m) => ({
    id: m.id,
    fecha: formatearFechaHora(m.created_at),
    itemNombre: m.item.nombre,
    tipoInventario: LABELS_TIPO[m.item.tipo] ?? m.item.tipo,
    tipoMov: m.tipo,
    motivo: m.motivo,
    cantidad: Number(m.cantidad),
    cantidadAnterior: Number(m.cantidad_anterior),
    cantidadNueva: Number(m.cantidad_nueva),
    unidad: m.item.unidad,
    notas: m.notas,
    usuario: m.usuario?.nombre ?? "—",
  }));

  const queryBase = new URLSearchParams();
  if (searchParams.tipo_inventario) queryBase.set("tipo_inventario", searchParams.tipo_inventario);
  if (searchParams.tipo_movimiento) queryBase.set("tipo_movimiento", searchParams.tipo_movimiento);
  if (searchParams.desde) queryBase.set("desde", searchParams.desde);
  if (searchParams.hasta) queryBase.set("hasta", searchParams.hasta);

  const exportUrl = `/api/inventarios/movimientos?exportar=true&${queryBase.toString()}`;

  return (
    <TablaMovimientos
      movimientos={serializados}
      pagina={pagina}
      totalPaginas={totalPaginas}
      total={total}
      filtros={searchParams}
      exportUrl={exportUrl}
    />
  );
}
