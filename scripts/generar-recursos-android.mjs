// Genera el ícono y la pantalla de carga de la APK (android/) con el logo oficial.
// Uso: node scripts/generar-recursos-android.mjs
import { readdir, writeFile, access } from "node:fs/promises";
import sharp from "sharp";

const LOGO = "public/logo-jalil.png";
const FONDO = "#F8F3EA"; // papel (tokens.superficies.papel)
const RES = "android/app/src/main/res";

/** Logo centrado en un lienzo de ancho × alto; `escala` = fracción del lado menor. */
async function lienzo(ancho, alto, escala) {
  const lado = Math.round(Math.min(ancho, alto) * escala);
  const logo = await sharp(LOGO).resize({ width: lado, height: lado, fit: "inside" }).toBuffer();
  return sharp({ create: { width: ancho, height: alto, channels: 4, background: FONDO } })
    .composite([{ input: logo, gravity: "center" }])
    .png();
}

async function circular(lado, escala) {
  const base = await (await lienzo(lado, lado, escala)).toBuffer();
  const mascara = Buffer.from(
    `<svg width="${lado}" height="${lado}"><circle cx="${lado / 2}" cy="${lado / 2}" r="${lado / 2}"/></svg>`
  );
  return sharp(base).composite([{ input: mascara, blend: "dest-in" }]).png();
}

// Ícono clásico (cuadrado y redondo) y capa frontal del ícono adaptativo.
const DENSIDADES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [densidad, factor] of Object.entries(DENSIDADES)) {
  const carpeta = `${RES}/mipmap-${densidad}`;
  const lado = Math.round(48 * factor);
  await (await lienzo(lado, lado, 0.86)).toFile(`${carpeta}/ic_launcher.png`);
  await (await circular(lado, 0.72)).toFile(`${carpeta}/ic_launcher_round.png`);
  // 108dp con zona segura de 66dp: el logo ocupa ~58 % para no recortarse en círculo.
  const frente = Math.round(108 * factor);
  const logo = await sharp(LOGO)
    .resize({ width: Math.round(frente * 0.58), height: Math.round(frente * 0.58), fit: "inside" })
    .toBuffer();
  await sharp({ create: { width: frente, height: frente, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(`${carpeta}/ic_launcher_foreground.png`);
}

await writeFile(
  `${RES}/values/ic_launcher_background.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${FONDO}</color>\n</resources>\n`
);

// Pantallas de carga: se respeta el tamaño de cada splash.png que trae la plantilla.
for (const carpeta of await readdir(RES)) {
  if (!carpeta.startsWith("drawable")) continue;
  const archivo = `${RES}/${carpeta}/splash.png`;
  try {
    await access(archivo);
  } catch {
    continue;
  }
  const { width, height } = await sharp(archivo).metadata();
  const buffer = await (await lienzo(width, height, 0.5)).toBuffer();
  await writeFile(archivo, buffer);
}

console.log("Recursos de Android generados.");
