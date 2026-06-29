import { prisma } from "@/lib/prisma";
import TablaInventario from "../TablaInventario";

export const dynamic = "force-dynamic";

export default async function ProductoTerminadoPage() {
  const items = await prisma.inventario_items.findMany({
    where: { tipo: "producto_terminado" },
    orderBy: { nombre: "asc" },
    include: { producto: { select: { id: true, nombre: true } } },
  });

  const serializados = items.map((i) => ({
    id: i.id, nombre: i.nombre, tipo: i.tipo, unidad: i.unidad,
    stock_actual: Number(i.stock_actual), stock_minimo: Number(i.stock_minimo),
    costo_unitario: Number(i.costo_unitario),
    fecha_vencimiento: i.fecha_vencimiento?.toISOString().split("T")[0] ?? null,
    producto: i.producto, activo: i.activo,
  }));

  return <TablaInventario items={serializados} tipo="producto_terminado" titulo="Producto terminado" />;
}
