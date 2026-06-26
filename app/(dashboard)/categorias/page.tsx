import { prisma } from "@/lib/prisma";
import TablaCategorias from "./TablaCategorias";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categorias = await prisma.categorias.findMany({
    orderBy: { orden: "asc" },
    include: { _count: { select: { productos: true } } },
  });

  const serializadas = categorias.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    slug: c.slug,
    emoji: c.emoji,
    orden: c.orden,
    activa: c.activa,
    num_productos: c._count.productos,
  }));

  return <TablaCategorias categorias={serializadas} />;
}
