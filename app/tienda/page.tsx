import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerClienteSesion } from "@/lib/tienda-auth";
import { precioEfectivo } from "@/lib/precios";
import { calcularHabituales, PEDIDOS_PARA_HABITUALES } from "@/lib/destacados";
import CatalogoTienda, { type ProductoTienda } from "./CatalogoTienda";

export const dynamic = "force-dynamic";

export default async function TiendaPage() {
  const cliente = await obtenerClienteSesion();
  if (!cliente) redirect("/tienda/login");

  const [categorias, productos, precios, pedidosRecientes] = await Promise.all([
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
    // Últimos pedidos del cliente para la franja "Tus habituales".
    prisma.pedidos.findMany({
      where: { cliente_id: cliente.id, estado: { not: "cancelado" } },
      orderBy: { created_at: "desc" },
      take: PEDIDOS_PARA_HABITUALES,
      select: { id: true, created_at: true, items: { select: { producto_id: true } } },
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

  // Destacados elegidos en el panel (solo activos), en su orden.
  const destacadosIds = productos
    .filter((p) => p.destacado)
    .sort((a, b) => (a.orden_destacado ?? 0) - (b.orden_destacado ?? 0))
    .map((p) => p.id);

  const habitualesIds = calcularHabituales(
    pedidosRecientes.flatMap((pedido) =>
      pedido.items.map((it) => ({ pedido_id: pedido.id, producto_id: it.producto_id, fecha: pedido.created_at }))
    ),
    new Set(productos.map((p) => p.id))
  );

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
      destacadosIds={destacadosIds}
      habitualesIds={habitualesIds}
    />
  );
}
