import { z } from "zod";

/** Máximo de productos destacados: más que esto deja de "destacar". */
export const MAX_DESTACADOS = 8;

/** Cuántos productos muestra la franja "Tus habituales". */
export const MAX_HABITUALES = 8;
/** Pedidos recientes del cliente que se miran para calcular sus habituales. */
export const PEDIDOS_PARA_HABITUALES = 10;
/** Un producto es "habitual" si aparece al menos en esta cantidad de pedidos. */
export const MIN_PEDIDOS_HABITUAL = 2;

/** Lista ordenada de ids destacados que envía el panel (reemplaza la anterior). */
export const esquemaDestacados = z.object({
  ids: z
    .array(z.uuid())
    .max(MAX_DESTACADOS, `Máximo ${MAX_DESTACADOS} productos destacados`)
    .refine((ids) => new Set(ids).size === ids.length, "Hay productos repetidos"),
});

/** Mueve un elemento una posición arriba (-1) o abajo (+1); devuelve una lista nueva. */
export function moverEnLista<T>(lista: T[], indice: number, direccion: -1 | 1): T[] {
  const destino = indice + direccion;
  if (indice < 0 || indice >= lista.length || destino < 0 || destino >= lista.length) return lista;
  const copia = [...lista];
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  return copia;
}

export interface LineaHistorial {
  pedido_id: string;
  producto_id: string;
  /** Fecha de creación del pedido, para desempatar por lo más reciente. */
  fecha: Date;
}

/**
 * "Tus habituales": los productos que el cliente pide más seguido en sus
 * últimos pedidos (cuenta en cuántos pedidos distintos aparece cada uno).
 * Solo entran los que siguen activos y aparecen en al menos
 * MIN_PEDIDOS_HABITUAL pedidos; empate → el pedido más reciente primero.
 */
export function calcularHabituales(
  lineas: LineaHistorial[],
  idsActivos: Set<string>,
  limite: number = MAX_HABITUALES
): string[] {
  const porProducto = new Map<string, { pedidos: Set<string>; ultima: number }>();
  for (const l of lineas) {
    if (!idsActivos.has(l.producto_id)) continue;
    const dato = porProducto.get(l.producto_id) ?? { pedidos: new Set<string>(), ultima: 0 };
    dato.pedidos.add(l.pedido_id);
    dato.ultima = Math.max(dato.ultima, l.fecha.getTime());
    porProducto.set(l.producto_id, dato);
  }
  return [...porProducto.entries()]
    .filter(([, d]) => d.pedidos.size >= MIN_PEDIDOS_HABITUAL)
    .sort((a, b) => b[1].pedidos.size - a[1].pedidos.size || b[1].ultima - a[1].ultima)
    .slice(0, limite)
    .map(([id]) => id);
}
