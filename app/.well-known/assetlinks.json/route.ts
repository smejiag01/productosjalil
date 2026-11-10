import { NextResponse } from "next/server";

/**
 * Digital Asset Links: le dice a Android que la APK (Trusted Web Activity)
 * es dueña de este dominio, para que abra a pantalla completa sin barra de
 * dirección. Se configura con variables de entorno en Vercel:
 *   TWA_PACKAGE_NAME          id del paquete de la APK (ej. co.productosjalil.app)
 *   TWA_SHA256_FINGERPRINTS   huellas SHA-256 de la llave de firma, separadas por coma
 * Las huellas son públicas (no son secretas).
 */
export const dynamic = "force-dynamic";

export function GET() {
  const paquete = process.env.TWA_PACKAGE_NAME?.trim() || "co.productosjalil.app";
  const huellas = (process.env.TWA_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((h) => h.trim().toUpperCase())
    .filter((h) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(h));

  const cuerpo = huellas.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: { namespace: "android_app", package_name: paquete, sha256_cert_fingerprints: huellas },
        },
      ]
    : [];

  return NextResponse.json(cuerpo, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
