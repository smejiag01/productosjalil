import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App Android (APK) para repartidores y vendedores. Es un contenedor nativo
 * que abre la web de producción: el middleware lleva a cada rol a su app.
 * Se compila con `npm run apk` (ver scripts/apk.mjs).
 */
const config: CapacitorConfig = {
  appId: "co.productosjalil.app",
  appName: "Productos Jalil",
  // Solo contiene la pantalla de "Sin señal"; la app real se carga de server.url.
  webDir: "capacitor-www",
  server: {
    url: "https://productosjalil.vercel.app",
    cleartext: false,
    // Si no carga (sin señal y sin copia guardada por el service worker).
    errorPath: "sin-senal.html",
  },
  android: {
    backgroundColor: "#F8F3EA",
    allowMixedContent: false,
  },
  plugins: {
    // La web no usa viewport-fit=cover: con "native" el contenido queda debajo
    // de la barra de estado y encima de la de navegación, nunca tapado por ellas.
    SystemBars: {
      insetsHandling: "native",
      initialViewportFitValueHint: "auto",
    },
  },
};

export default config;
