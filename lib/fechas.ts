import { hoyStr, toUtcInicioTs, toUtcFinTs } from "@/lib/analiticas/periodos";

const ZONA = "America/Bogota";

/**
 * Helper centralizado para mostrar fechas/horas al usuario. Úsalo con
 * columnas TIMESTAMPTZ (created_at, confirmado_at, entregado_at, etc.) — un
 * instante en el tiempo que debe convertirse a hora Colombia para mostrarse.
 *
 * NO uses estas funciones con columnas DATE puras (fecha_pedido,
 * fecha_vencimiento): esas ya representan la fecha literal elegida y se
 * guardan como medianoche UTC; convertirlas a America/Bogota las correría un
 * día hacia atrás. Esas se formatean con timeZone: "UTC" (ver
 * lib/analiticas/periodos.ts).
 */

function partes(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const campos = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);
  const valor = (tipo: string) => campos.find((p) => p.type === tipo)?.value ?? "";
  return {
    dia: valor("day"),
    mes: valor("month"),
    anio: valor("year"),
    hora: valor("hour"),
    minuto: valor("minute"),
    periodo: valor("dayPeriod").toLowerCase(),
  };
}

/** DD/MM/YYYY en hora Colombia. */
export function formatearFecha(fecha: Date | string): string {
  const { dia, mes, anio } = partes(fecha);
  return `${dia}/${mes}/${anio}`;
}

/** DD/MM/YYYY, h:mm a.m./p.m. en hora Colombia. */
export function formatearFechaHora(fecha: Date | string): string {
  const { dia, mes, anio, hora, minuto, periodo } = partes(fecha);
  const horaSinCero = String(Number(hora));
  const sufijo = periodo === "am" ? "a.m." : "p.m.";
  return `${dia}/${mes}/${anio}, ${horaSinCero}:${minuto} ${sufijo}`;
}

/** Instante UTC de las 00:00:00 hora Bogota del día dado (o "hoy" en Bogota si se omite). */
export function inicioDelDiaBogota(fechaStr?: string): Date {
  return toUtcInicioTs(fechaStr ?? hoyStr());
}

/** Instante UTC de las 23:59:59.999 hora Bogota del día dado (o "hoy" en Bogota si se omite). */
export function finDelDiaBogota(fechaStr?: string): Date {
  return toUtcFinTs(fechaStr ?? hoyStr());
}
