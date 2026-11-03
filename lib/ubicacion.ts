/**
 * Ayudantes puros para ubicaciones de Google Maps: leer coordenadas de un
 * enlace o texto, armar enlaces y decidir qué dominios son de Google (para que
 * el servidor solo siga redirecciones hacia Google y no hacia cualquier sitio).
 */

export interface Coordenadas {
  lat: number;
  lng: number;
}

function valido(lat: number, lng: number): Coordenadas | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  // 6 decimales ≈ 11 cm: más que suficiente y evita números larguísimos
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}

const NUM = "(-?\\d{1,3}(?:\\.\\d+)?)";

/**
 * Extrae coordenadas de lo que el usuario pegue:
 *  - "4.8087, -75.6906" (o separado por espacio/punto y coma)
 *  - enlaces largos de Google Maps: .../@4.8,-75.6,17z, ...!3d4.8!4d-75.6,
 *    ?q=4.8,-75.6, ?ll=..., ?query=...
 * Devuelve null si no encuentra un par válido.
 */
export function parsearUbicacion(texto: string): Coordenadas | null {
  const t = (texto ?? "").trim();
  if (!t) return null;

  // 1) Solo coordenadas
  let m = t.match(new RegExp(`^${NUM}\\s*[,;\\s]\\s*${NUM}$`));
  if (m) return valido(parseFloat(m[1]), parseFloat(m[2]));

  // 2) Pin exacto del lugar (!3d<lat>!4d<lng>): es más preciso que el centro de la vista
  m = t.match(new RegExp(`!3d${NUM}!4d${NUM}`));
  if (m) return valido(parseFloat(m[1]), parseFloat(m[2]));

  // 3) Parámetros de consulta (q, ll, query, destination, center)
  m = t.match(new RegExp(`[?&](?:q|ll|query|destination|center)=${NUM}(?:,|%2C)${NUM}`, "i"));
  if (m) return valido(parseFloat(m[1]), parseFloat(m[2]));

  // 4) Centro de la vista (@lat,lng,zoom)
  m = t.match(new RegExp(`@${NUM},${NUM}`));
  if (m) return valido(parseFloat(m[1]), parseFloat(m[2]));

  return null;
}

/** Enlace para abrir el punto en Google Maps. */
export function enlaceGoogleMaps(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

const HOSTS_GOOGLE = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "google.com",
  "www.google.com",
  "maps.google.com",
]);

/**
 * ¿Es una URL https de Google Maps que podemos seguir con seguridad? Evita que
 * el servidor haga peticiones a sitios arbitrarios (SSRF).
 */
export function esUrlDeGoogleMaps(valor: string): boolean {
  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (!HOSTS_GOOGLE.has(host)) return false;
  // goo.gl es de muchos usos: solo los enlaces de mapas
  if (host === "goo.gl" && !url.pathname.startsWith("/maps")) return false;
  // google.com sirve de todo: solo la parte de mapas
  if ((host === "google.com" || host === "www.google.com") && !url.pathname.startsWith("/maps")) {
    return false;
  }
  return true;
}
