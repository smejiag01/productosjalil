import { prisma } from "@/lib/prisma";

/**
 * Precio efectivo de un producto para un cliente: si el cliente tiene un precio
 * propio (precios_cliente) se usa ese; si no, el precio_base del producto.
 * Función pura (sin DB) para poder testearla y reusarla al crear pedidos.
 */
export function precioEfectivo(
  precioBase: number,
  precioOverride: number | undefined | null
): number {
  return precioOverride != null ? precioOverride : precioBase;
}

/**
 * Trae los precios propios de un cliente para un conjunto de productos y los
 * devuelve como mapa producto_id -> precio. Los productos que no tengan precio
 * propio simplemente no aparecen en el mapa (se resuelven con precioEfectivo).
 */
export async function resolverPreciosCliente(
  clienteId: string,
  productoIds: string[]
): Promise<Map<string, number>> {
  if (productoIds.length === 0) return new Map();
  const precios = await prisma.precios_cliente.findMany({
    where: { cliente_id: clienteId, producto_id: { in: productoIds } },
  });
  return new Map(precios.map((p) => [p.producto_id, Number(p.precio)]));
}
