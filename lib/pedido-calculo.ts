/**
 * Recomputo de subtotales y total de un pedido. Función pura: recibe líneas ya
 * con su precio_unitario resuelto en el servidor y devuelve las líneas con
 * subtotal + el total. El servidor NUNCA confía en subtotales que vengan del
 * navegador; siempre se recalculan aquí.
 */

export interface LineaPrecio {
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export interface LineaCalculada extends LineaPrecio {
  subtotal: number;
}

export function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcularLineas(lineas: LineaPrecio[]): {
  lineas: LineaCalculada[];
  total: number;
} {
  const calculadas = lineas.map((l) => ({
    ...l,
    subtotal: redondear(l.cantidad * l.precio_unitario),
  }));
  const total = redondear(calculadas.reduce((suma, l) => suma + l.subtotal, 0));
  return { lineas: calculadas, total };
}
