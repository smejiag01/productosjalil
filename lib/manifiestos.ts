import { NextResponse } from "next/server";

/**
 * Manifiestos de las dos apps instalables (PWA):
 * - Personal (/manifest.webmanifest): abre "/" y el middleware lleva a cada rol a su app.
 * - Tienda (/manifest-tienda.webmanifest): clientes, abre directo en /tienda.
 * Cada layout enlaza el suyo con `metadata.manifest`.
 */
const ICONOS = [
  { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

const COMUN = {
  lang: "es-CO",
  display: "standalone",
  orientation: "portrait",
  background_color: "#F8F3EA",
  theme_color: "#BC4220",
  icons: ICONOS,
};

export const MANIFIESTO_PERSONAL = {
  ...COMUN,
  id: "/",
  name: "Productos Jalil",
  short_name: "Jalil",
  description: "App de Productos Jalil para el personal: panel, repartidores y vendedores",
  start_url: "/",
  scope: "/",
};

export const MANIFIESTO_TIENDA = {
  ...COMUN,
  id: "/tienda",
  name: "Productos Jalil — Pedidos",
  short_name: "Jalil Pedidos",
  description: "Haz tu pedido de Productos Jalil desde el celular.",
  start_url: "/tienda",
  scope: "/tienda",
};

export function respuestaManifiesto(manifiesto: object) {
  return NextResponse.json(manifiesto, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
