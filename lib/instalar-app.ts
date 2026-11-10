/**
 * Reglas del aviso "Instalar app" (components/AvisoInstalarApp.tsx). Funciones
 * puras para poder probarlas sin navegador.
 */

export type Plataforma = "ios" | "android" | "otra";

/** iPadOS se presenta como "Macintosh", pero con pantalla táctil. */
export function detectarPlataforma(userAgent: string, puntosTactiles: number): Plataforma {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Macintosh/i.test(userAgent) && puntosTactiles > 1) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "otra";
}

/** Días que se deja de mostrar el aviso cuando la persona dice "Ahora no". */
export const DIAS_SIN_AVISO = 14;

export function avisoDescartadoVigente(descartadoEn: number | null, ahora: number): boolean {
  if (!descartadoEn || Number.isNaN(descartadoEn)) return false;
  return ahora - descartadoEn < DIAS_SIN_AVISO * 86_400_000;
}

/**
 * Se muestra solo en celular o tablet, si la app no está ya abierta como app
 * instalada (ni dentro de la APK) y si no se descartó hace poco.
 */
export function debeMostrarAviso(opciones: {
  plataforma: Plataforma;
  esTactil: boolean;
  instalada: boolean;
  dentroDeApk: boolean;
  descartadoEn: number | null;
  ahora: number;
}): boolean {
  const { plataforma, esTactil, instalada, dentroDeApk, descartadoEn, ahora } = opciones;
  if (instalada || dentroDeApk) return false;
  if (plataforma === "otra" || !esTactil) return false;
  return !avisoDescartadoVigente(descartadoEn, ahora);
}
