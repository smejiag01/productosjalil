import { z } from "zod";

export const esquemaCliente = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(160),
  telefono: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(40)
    .transform((val) => val.replace(/[\s\-\(\)]/g, "")),
  direccion: z.string().optional().nullable(),
  codigo_mekano: z.string().max(40).optional().nullable(),
  ruta_id: z.string().uuid("Ruta inválida").optional().nullable(),
  activo: z.boolean().optional(),
  notas: z.string().optional().nullable(),
});

export const esquemaPrecioCliente = z.object({
  producto_id: z.string().uuid("Producto inválido"),
  precio: z.number().positive("El precio debe ser mayor a 0"),
});
