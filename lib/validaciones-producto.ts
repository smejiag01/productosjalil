import { z } from "zod";

export const UNIDADES = ["kg", "unidad", "caja", "libra", "arroba"] as const;

export const esquemaProducto = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(140),
  descripcion: z.string().optional().nullable(),
  unidad: z.enum(UNIDADES, {
    error: "Selecciona una unidad válida",
  }),
  precio_base: z
    .number()
    .positive("El precio debe ser mayor a 0"),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
});

export const esquemaOrden = z.array(
  z.object({
    id: z.string().uuid(),
    orden: z.number().int().min(0),
  })
);
