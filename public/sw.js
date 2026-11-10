/*
 * Service worker de la app instalable (repartidor y vendedor).
 *
 * - Archivos de /_next/static (llevan hash, nunca cambian): primero caché.
 * - Pantallas /vendedor y /repartidor: primero red; si no hay señal se abre
 *   la última copia guardada, así el vendedor puede seguir registrando
 *   visitas (la cola sin señal vive en localStorage).
 * - Nada de /api ni de datos de Next (RSC) se guarda.
 * - Al cerrar sesión la app borra estas cachés (lib/pwa.ts).
 */
const VERSION = "v1";
const CACHE_ESTATICOS = `jalil-estaticos-${VERSION}`;
const CACHE_PAGINAS = `jalil-paginas-${VERSION}`;

const PAGINA_SIN_SENAL = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin señal</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F8F3EA;color:#231815;font-family:system-ui,sans-serif;text-align:center;padding:24px}
button{margin-top:16px;height:48px;padding:0 24px;border:0;border-radius:10px;background:#BC4220;color:#fff;font-size:16px;font-weight:600}</style></head>
<body><div><h1>Sin señal</h1><p>No hay conexión a internet. Intenta de nuevo cuando tengas señal.</p>
<button onclick="location.reload()">Reintentar</button></div></body></html>`;

function esPaginaDeApp(url) {
  return /^\/(vendedor|repartidor)(\/|$)/.test(url.pathname);
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const claves = await caches.keys();
      await Promise.all(
        claves
          .filter((c) => c.startsWith("jalil-") && c !== CACHE_ESTATICOS && c !== CACHE_PAGINAS)
          .map((c) => caches.delete(c))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    evento.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_ESTATICOS);
        const guardado = await cache.match(request);
        if (guardado) return guardado;
        const respuesta = await fetch(request);
        if (respuesta.ok) cache.put(request, respuesta.clone());
        return respuesta;
      })()
    );
    return;
  }

  if (request.mode !== "navigate") return;

  evento.respondWith(
    (async () => {
      try {
        const respuesta = await fetch(request);
        // Solo se guarda la pantalla real (no una redirección al login).
        if (esPaginaDeApp(url) && respuesta.ok && !respuesta.redirected) {
          const cache = await caches.open(CACHE_PAGINAS);
          cache.put(url.pathname, respuesta.clone());
        }
        return respuesta;
      } catch {
        if (esPaginaDeApp(url)) {
          const guardado = await caches.match(url.pathname);
          if (guardado) return guardado;
        }
        return new Response(PAGINA_SIN_SENAL, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    })()
  );
});
