import { z } from "zod";

/** Tipos de negocio que visitan los vendedores. "Otro" permite escribir uno nuevo. */
export const NICHOS = [
  "Hamburguesería",
  "Restaurante",
  "Comidas rápidas",
  "Cafetería",
  "Pizzería",
  "Asadero",
  "Tienda / Minimercado",
] as const;

/** Fecha (YYYY-MM-DD) en Colombia de un instante; el día de la jornada no depende del servidor. */
export function fechaBogota(instante: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
}

/** Hora corta en Colombia ("2:05 p. m.") para mostrar en la app y el informe. */
export function horaBogota(instante: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
  }).format(instante);
}

const MINUTOS_FUTURO_PERMITIDOS = 10;
const DIAS_PASADO_PERMITIDOS = 14;

/**
 * Las marcas de tiempo vienen del celular (pueden llegar horas después si no
 * había señal). Se aceptan si no están en el futuro ni son muy viejas.
 */
export function instanteValido(iso: string, ahora: Date = new Date()): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  const maxFuturo = ahora.getTime() + MINUTOS_FUTURO_PERMITIDOS * 60_000;
  const minPasado = ahora.getTime() - DIAS_PASADO_PERMITIDOS * 86_400_000;
  return t <= maxFuturo && t >= minPasado;
}

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const instante = z.string().refine((v) => instanteValido(v), "Fecha y hora inválidas");

const coordenadas = {
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
};

export const esquemaOperacion = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("iniciar_jornada"),
    id: z.uuid(),
    ciudad: z.string().trim().min(2, "Escribe la ciudad").max(120),
    inicio_at: instante,
    ...coordenadas,
  }),
  z.object({
    tipo: z.literal("visita"),
    id: z.uuid(),
    jornada_id: z.uuid(),
    registrada_at: instante,
    nicho: z.string().trim().min(2, "Elige el tipo de negocio").max(60),
    nombre_empresa: z.string().trim().min(2, "Escribe el nombre del negocio").max(160),
    direccion: textoOpcional(300),
    telefono: textoOpcional(40),
    contacto: textoOpcional(120),
    observaciones: textoOpcional(2000),
    precision_m: z.number().min(0).max(100_000).optional().nullable(),
    ...coordenadas,
  }),
  z.object({
    tipo: z.literal("finalizar_jornada"),
    id: z.uuid(),
    fin_at: instante,
    ...coordenadas,
  }),
]);

export type OperacionVisitas = z.infer<typeof esquemaOperacion>;

export const esquemaSincronizacion = z.object({
  operaciones: z.array(z.unknown()).min(1).max(100),
});
