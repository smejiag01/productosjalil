import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerClienteSesion } from "@/lib/tienda-auth";
import { precioEfectivo } from "@/lib/precios";
import CatalogoTienda, { type ProductoTienda } from "./CatalogoTienda";

export const dynamic = "force-dynamic";

export default async function TiendaPage() {
  const cliente = await obtenerClienteSesion();
  if (!cliente) redirect("/tienda/login");

  const [categorias, productos, precios] = await Promise.all([
    prisma.categorias.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    }),
    prisma.productos.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    }),
    prisma.precios_cliente.findMany({
      where: { cliente_id: cliente.id },
    }),
  ]);

  const preciosMap = new Map(precios.map((p) => [p.producto_id, Number(p.precio)]));

  const productosTienda: ProductoTienda[] = productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    nombre_corto: p.nombre_corto,
    unidad: p.unidad,
    imagen_url: p.imagen_url,
    categoria_id: p.categoria_id,
    precio: precioEfectivo(Number(p.precio_base), preciosMap.get(p.id)),
  }));

  const categoriasTienda = categorias.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    emoji: c.emoji,
  }));

  return (
    <CatalogoTienda
      nombreCliente={cliente.nombre}
      categorias={categoriasTienda}
      productos={productosTienda}
    />
  );
}
