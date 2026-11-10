import type { MetadataRoute } from "next";

/**
 * Manifiesto de la app instalable. La APK (Trusted Web Activity) abre "/" y
 * el middleware lleva a cada rol a su app: repartidor → /repartidor,
 * vendedor → /vendedor, sin sesión → /login.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Productos Jalil",
    short_name: "Jalil",
    description: "App de repartidores y vendedores de Productos Jalil",
    lang: "es-CO",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F8F3EA",
    theme_color: "#BC4220",
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
