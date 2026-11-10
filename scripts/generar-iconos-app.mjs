// Genera los íconos de la app instalable (PWA / APK) a partir del logo oficial.
// Uso: node scripts/generar-iconos-app.mjs
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const LOGO = "public/logo-jalil.png";
const FONDO = "#F8F3EA"; // papel (tokens.superficies.papel)
const SALIDA = "public/iconos";

/** Logo centrado sobre fondo crema; `escala` es la fracción del lado que ocupa. */
async function icono(lado, escala, archivo) {
  const ancho = Math.round(lado * escala);
  const logo = await sharp(LOGO).resize({ width: ancho, height: ancho, fit: "inside" }).toBuffer();
  await sharp({ create: { width: lado, height: lado, channels: 4, background: FONDO } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(`${SALIDA}/${archivo}`);
}

await mkdir(SALIDA, { recursive: true });
await icono(192, 0.84, "icono-192.png");
await icono(512, 0.84, "icono-512.png");
// "maskable": Android recorta en círculo; el logo va dentro de la zona segura (~60 %).
await icono(512, 0.6, "icono-maskable-512.png");
console.log("Íconos generados en", SALIDA);
