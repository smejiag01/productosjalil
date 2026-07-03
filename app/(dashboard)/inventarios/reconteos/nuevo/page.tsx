import { prisma } from "@/lib/prisma";
import NuevoReconteo from "./NuevoReconteo";

export const dynamic = "force-dynamic";

export default async function NuevoReconteoPage() {
  const items = await prisma.inventario_items.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, tipo: true, unidad: true, stock_actual: true },
    orderBy: { nombre: "asc" },
  });

  const serializados = items.map((i) => ({
    id: i.id,
    nombre: i.nombre,
    tipo: i.tipo,
    unidad: i.unidad,
    stock_actual: Number(i.stock_actual),
  }));

  return <NuevoReconteo items={serializados} />;
}
