import { prisma } from "@/lib/prisma";
import TablaInventario from "../TablaInventario";

export const dynamic = "force-dynamic";

export default async function InsumosPage() {
  const items = await prisma.inventario_items.findMany({
    where: { tipo: "insumo" },
    orderBy: { nombre: "asc" },
    include: { producto: { select: { id: true, nombre: true } } },
  });

  const serializados = items.map((i) => ({
    id: i.id, nombre: i.nombre, tipo: i.tipo, unidad: i.unidad,
    stock_actual: Number(i.stock_actual), stock_minimo: Number(i.stock_minimo),
    costo_unitario: Number(i.costo_unitario), proveedor: i.proveedor,
    activo: i.activo, producto: i.producto,
  }));

  return <TablaInventario items={serializados} tipo="insumo" titulo="Insumos" />;
}
