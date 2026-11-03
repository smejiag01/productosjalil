import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { esUrlDeGoogleMaps, parsearUbicacion } from "@/lib/ubicacion";

const esquema = z.object({ url: z.string().trim().min(1).max(2000) });

const MAX_REDIRECCIONES = 5;

/**
 * Convierte un enlace de Google Maps (incluso los cortos maps.app.goo.gl) en
 * coordenadas. Solo sigue redirecciones hacia dominios de Google Maps, para que
 * el servidor no se pueda usar para consultar otros sitios.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const resultado = esquema.safeParse(await request.json().catch(() => null));
  if (!resultado.success) {
    return NextResponse.json({ success: false, error: "Enlace inválido" }, { status: 400 });
  }

  let actual = resultado.data.url;
  if (!esUrlDeGoogleMaps(actual)) {
    return NextResponse.json(
      { success: false, error: "Pega un enlace de Google Maps" },
      { status: 400 }
    );
  }

  try {
    for (let i = 0; i <= MAX_REDIRECCIONES; i++) {
      const coordenadas = parsearUbicacion(actual);
      if (coordenadas) {
        return NextResponse.json({ success: true, data: coordenadas });
      }

      const res = await fetch(actual, {
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ProductosJalil/1.0)" },
      });
      const destino = res.headers.get("location");
      if (res.status < 300 || res.status >= 400 || !destino) break;

      actual = new URL(destino, actual).toString();
      if (!esUrlDeGoogleMaps(actual)) break;
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "No se pudo abrir el enlace. Intenta de nuevo." },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { success: false, error: "No encontramos coordenadas en ese enlace" },
    { status: 422 }
  );
}
