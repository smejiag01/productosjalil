import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import ListaProductos from "./ListaProductos";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const productos = await prisma.productos.findMany({
    orderBy: { orden: "asc" },
  });

  const productosSerializados = productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    imagen_url: p.imagen_url,
    unidad: p.unidad,
    precio_base: Number(p.precio_base),
    precio_base_formateado: formatearPrecio(Number(p.precio_base)),
    activo: p.activo,
    orden: p.orden,
  }));

  return <ListaProductos productos={productosSerializados} />;
}
