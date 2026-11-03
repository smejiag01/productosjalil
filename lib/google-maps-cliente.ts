/**
 * Carga la API de Google Maps (JavaScript) una sola vez en el navegador.
 * Requiere NEXT_PUBLIC_GOOGLE_MAPS_API_KEY con "Maps JavaScript API" y
 * "Places API (New)" habilitadas. La clave se protege restringiéndola por
 * dominio (referrer) en Google Cloud, no escondiéndola: en el navegador siempre es visible.
 */

export const CLAVE_GOOGLE_MAPS = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

let promesa: Promise<void> | null = null;

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export function cargarGoogleMaps(): Promise<void> {
  if (!CLAVE_GOOGLE_MAPS) return Promise.reject(new Error("Falta la clave de Google Maps"));
  if (typeof window === "undefined") return Promise.reject(new Error("Solo en el navegador"));
  if (window.google?.maps) return Promise.resolve();
  if (promesa) return promesa;

  promesa = new Promise<void>((resolve, reject) => {
    // Google llama a esta función si la clave es inválida o está restringida a otro dominio
    window.gm_authFailure = () => {
      promesa = null;
      reject(new Error("Google rechazó la clave de Maps"));
    };

    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js" +
      `?key=${encodeURIComponent(CLAVE_GOOGLE_MAPS)}&v=weekly&loading=async&language=es&region=CO`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      promesa = null;
      reject(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(script);
  });
  return promesa;
}
