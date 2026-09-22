import { hoyStr, addDias } from "@/lib/analiticas/periodos";

/**
 * Cálculo de las próximas fechas de entrega disponibles para un cliente, a
 * partir de la ruta a la que pertenece. Reproduce la lógica del flujo de
 * WhatsApp: se miran los próximos ~21 días y se dejan solo los que caen en un
 * día de la semana en que sale la ruta (dias_semana, 0=Dom..6=Sáb). Si la ruta
 * es 'quincenal' y tiene fecha_base, además el día debe estar en fase con la
 * quincena ((fecha - fecha_base) múltiplo de 14 días).
 *
 * Función pura y determinista (se le puede pasar `hoy` para testear).
 */

export interface RutaEntrega {
  dias_semana: number[];
  frecuencia: string;
  fecha_base: Date | null;
}

const DIA_MS = 86400000;

function diaSemanaDe(fechaStr: string): number {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function utcMsDe(fechaStr: string): number {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function proximasFechasEntrega(
  ruta: RutaEntrega,
  cantidad = 10,
  hoy: string = hoyStr()
): string[] {
  const dias = ruta.dias_semana ?? [];
  if (dias.length === 0) return [];

  const esQuincenal = ruta.frecuencia === "quincenal" && ruta.fecha_base != null;
  const baseMs = ruta.fecha_base
    ? Date.UTC(
        ruta.fecha_base.getUTCFullYear(),
        ruta.fecha_base.getUTCMonth(),
        ruta.fecha_base.getUTCDate()
      )
    : 0;

  const resultado: string[] = [];
  // Se empieza en mañana (i=1): no se ofrece entrega el mismo día.
  for (let i = 1; i <= 21 && resultado.length < cantidad; i++) {
    const fecha = addDias(hoy, i);
    if (!dias.includes(diaSemanaDe(fecha))) continue;

    if (esQuincenal) {
      const diffDias = Math.round((utcMsDe(fecha) - baseMs) / DIA_MS);
      // módulo siempre positivo
      if (((diffDias % 14) + 14) % 14 !== 0) continue;
    }

    resultado.push(fecha);
  }

  return resultado;
}
