import { z } from "zod";

/**
 * Normaliza un NIT / número de documento tal como lo escribe el cliente:
 * quita puntos y espacios, y si trae un guion (dígito de verificación, ej.
 * "901234567-8") se queda solo con lo de ANTES del guion → "901234567".
 * Es el mismo criterio con que se guardan los NIT de clientes en la BD.
 */
export function normalizarNit(valor: string): string {
  const limpio = valor.replace(/[\s.]/g, "");
  const guion = limpio.indexOf("-");
  return guion >= 0 ? limpio.slice(0, guion) : limpio;
}

export const esquemaLoginNit = z.object({
  nit: z
    .string()
    .min(1, "Ingresa tu NIT o número de documento")
    .transform(normalizarNit)
    .refine((v) => v.length > 0, "Ingresa tu NIT o número de documento"),
});

export const esquemaItemCarrito = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
});

/** Snapshot mínimo del carrito que se persiste en cookie (sin precios). */
export const esquemaCarrito = z.object({
  items: z.array(esquemaItemCarrito),
});

export const esquemaCrearPedido = z.object({
  fecha_entrega: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de entrega inválida"),
  sede_id: z.string().uuid().optional().nullable(),
  items: z.array(esquemaItemCarrito).min(1, "El carrito está vacío"),
});
