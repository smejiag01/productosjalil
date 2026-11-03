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

/** Deja solo los dígitos de un teléfono ("+57 312 722-1364" → "573127221364"). */
export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/**
 * Normaliza un número de WhatsApp colombiano al formato de wa.me: solo dígitos
 * con prefijo de país. Acepta "316 333 2739", "3163332739" o "+57 316 333 2739".
 * Devuelve null si no es un celular colombiano válido (10 dígitos que
 * empiezan por 3, con o sin el 57 adelante).
 */
export function normalizarWhatsapp(valor: string): string | null {
  const digitos = soloDigitos(valor);
  if (/^3\d{9}$/.test(digitos)) return `57${digitos}`;
  if (/^573\d{9}$/.test(digitos)) return digitos;
  return null;
}

export const esquemaLoginTienda = z.object({
  nit: z
    .string()
    .min(1, "Ingresa tu NIT o número de documento")
    .max(40)
    .transform(normalizarNit)
    .refine((v) => v.length > 0, "Ingresa tu NIT o número de documento"),
});

// Límites defensivos: el navegador es opcional-confiable, así que se acota el
// tamaño de lo que se acepta (el servidor igual recalcula todo).
const MAX_CANTIDAD_POR_PRODUCTO = 9999;
const MAX_PRODUCTOS_DISTINTOS = 100;

export const esquemaItemCarrito = z.object({
  producto_id: z.string().uuid(),
  cantidad: z
    .number()
    .positive("La cantidad debe ser mayor a 0")
    .max(MAX_CANTIDAD_POR_PRODUCTO, "Cantidad demasiado grande"),
});

/** Snapshot mínimo del carrito que se persiste en cookie (sin precios). */
export const esquemaCarrito = z.object({
  items: z.array(esquemaItemCarrito).max(MAX_PRODUCTOS_DISTINTOS),
});

export const esquemaCrearPedido = z.object({
  fecha_entrega: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de entrega inválida"),
  sede_id: z.string().uuid().optional().nullable(),
  items: z
    .array(esquemaItemCarrito)
    .min(1, "El carrito está vacío")
    .max(MAX_PRODUCTOS_DISTINTOS),
});
