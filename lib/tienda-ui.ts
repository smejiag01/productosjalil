/** Ayudantes puros de la interfaz de la tienda (testeables sin navegador). */

export interface PosicionSeccion {
  id: string;
  /** Distancia del borde superior de la sección al borde superior de la ventana. */
  top: number;
}

/**
 * Categoría "activa" para el scroll-spy de los chips: la última sección cuyo
 * borde superior ya pasó el umbral (justo debajo del encabezado fijo). Las
 * secciones deben venir en el orden en que aparecen en la página.
 */
export function elegirCategoriaActiva(
  secciones: PosicionSeccion[],
  umbral: number,
  alFinalDeLaPagina = false
): string | null {
  if (secciones.length === 0) return null;
  // Al llegar al final del scroll la última sección puede no alcanzar nunca el
  // umbral (si es corta): se da por activa igualmente.
  if (alFinalDeLaPagina) return secciones[secciones.length - 1].id;

  let activa = secciones[0].id;
  for (const s of secciones) {
    if (s.top <= umbral) activa = s.id;
    else break;
  }
  return activa;
}

/** "Viernes, 25 de septiembre" → { dia: "Viernes", fecha: "25 de septiembre" } */
export function partirEtiquetaFecha(etiqueta: string): { dia: string; fecha: string } {
  const i = etiqueta.indexOf(", ");
  if (i < 0) return { dia: etiqueta, fecha: "" };
  return { dia: etiqueta.slice(0, i), fecha: etiqueta.slice(i + 2) };
}
