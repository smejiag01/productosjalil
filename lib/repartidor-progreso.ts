/**
 * Cálculos de la lista de entregas del repartidor: avance del día, cuál es la
 * siguiente parada y el número de parada dentro de cada ruta.
 */

interface EntregaBase {
  id: string;
  estado: string;
}

const ESTADOS_RESUELTOS = ["entregado", "devuelto"];
const ESTADOS_LISTOS = ["confirmado", "en_reparto"];

/** Entregada o devuelta: ya no requiere acción del repartidor. */
export function estaResuelta(estado: string): boolean {
  return ESTADOS_RESUELTOS.includes(estado);
}

/**
 * Solo confirmado/en_reparto pueden pasar a entregado o devuelto
 * (ver TRANSICIONES_VALIDAS en lib/pedidos.ts).
 */
export function estaListaParaEntrega(estado: string): boolean {
  return ESTADOS_LISTOS.includes(estado);
}

export interface Progreso {
  total: number;
  resueltas: number;
  pendientes: number;
  /** 0–100, entero */
  porcentaje: number;
}

export function calcularProgreso(entregas: EntregaBase[]): Progreso {
  const total = entregas.length;
  const resueltas = entregas.filter((e) => estaResuelta(e.estado)).length;
  return {
    total,
    resueltas,
    pendientes: total - resueltas,
    porcentaje: total === 0 ? 0 : Math.round((resueltas / total) * 100),
  };
}

/** Primera parada lista para entregar, en el orden recibido; null si no hay. */
export function siguienteParada(entregas: EntregaBase[]): string | null {
  return entregas.find((e) => estaListaParaEntrega(e.estado))?.id ?? null;
}

/** Número de parada (1, 2, 3…) de cada entrega dentro de su ruta, según el orden recibido. */
export function numerarParadas(entregas: (EntregaBase & { rutaId: string })[]): Map<string, number> {
  const contadores = new Map<string, number>();
  const numeros = new Map<string, number>();
  for (const e of entregas) {
    const n = (contadores.get(e.rutaId) ?? 0) + 1;
    contadores.set(e.rutaId, n);
    numeros.set(e.id, n);
  }
  return numeros;
}
