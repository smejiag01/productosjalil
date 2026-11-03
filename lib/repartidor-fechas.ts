import { addDias, toDbDate } from "@/lib/analiticas/periodos";

/** ¿Es una fecha real con formato YYYY-MM-DD? (rechaza 2026-02-31, "hoy", vacío, etc.) */
export function fechaValida(s: string | undefined | null): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const fecha = toDbDate(s);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === s;
}

/** La fecha pedida en la URL si es válida; si no, hoy. */
export function resolverFecha(param: string | undefined | null, hoy: string): string {
  return fechaValida(param) ? param : hoy;
}

/** "jueves, 6 de noviembre" (agrega el año solo si no es el del día de hoy). */
export function textoFechaLarga(fecha: string, hoy: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const otroAnio = fecha.slice(0, 4) !== hoy.slice(0, 4);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(otroAnio ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  });
}

/** "Hoy", "Mañana", "Ayer" o, para cualquier otro día, la fecha larga. */
export function etiquetaDia(fecha: string, hoy: string): string {
  if (fecha === hoy) return "Hoy";
  if (fecha === addDias(hoy, 1)) return "Mañana";
  if (fecha === addDias(hoy, -1)) return "Ayer";
  return textoFechaLarga(fecha, hoy);
}
