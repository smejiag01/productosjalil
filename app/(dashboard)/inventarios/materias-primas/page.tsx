import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { INVENTARIO_MATERIA_PRIMA_HABILITADO } from "@/lib/inventario-flags";
import TablaInventario from "../TablaInventario";

export const dynamic = "force-dynamic";

export default async function MateriasPrimasPage() {
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) notFound();

  const items = await prisma.inventario_items.findMany({
    where: { tipo: "materia_prima" },
    orderBy: { nombre: "asc" },
    include: { producto: { select: { id: true, nombre: true } } },
  });

  const serializados = items.map((i) => ({
    id: i.id, nombre: i.nombre, tipo: i.tipo, unidad: i.unidad,
    stock_actual: Number(i.stock_actual), stock_minimo: Number(i.stock_minimo),
    costo_unitario: Number(i.costo_unitario), tipo_animal: i.tipo_animal,
    requiere_refrigeracion: i.requiere_refrigeracion,
    fecha_vencimiento: i.fecha_vencimiento?.toISOString().split("T")[0] ?? null,
    activo: i.activo, producto: i.producto,
  }));

  return <TablaInventario items={serializados} tipo="materia_prima" titulo="Materias primas" />;
}
