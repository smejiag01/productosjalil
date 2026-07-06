import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

type ResultadoGuardia =
  | { session: Session; error: null }
  | { session: null; error: NextResponse };

/**
 * Exige una sesión autenticada (cualquier rol). Úsalo para endpoints que
 * un usuario logueado puede usar sobre sus propios datos (ej. su cuenta),
 * validando el filtrado de propiedad dentro del propio handler.
 */
export async function requireSession(): Promise<ResultadoGuardia> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

/**
 * Exige una sesión autenticada con rol='admin'. Úsalo en todos los
 * endpoints administrativos (clientes, productos, rutas, analiticas, etc.)
 * para que un repartidor no pueda invocarlos directamente aunque tenga
 * una sesión válida.
 */
export async function requireAdmin(): Promise<ResultadoGuardia> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 }),
    };
  }
  if (session.user.rol !== "admin") {
    return {
      session: null,
      error: NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 }),
    };
  }
  return { session, error: null };
}

/** Header + variable de entorno usados por n8n para llamar endpoints sin sesión de dashboard. */
export function esApiKeyValida(request: Request, envVar: string): boolean {
  const apiKey = request.headers.get("x-api-key");
  const esperado = process.env[envVar];
  return !!apiKey && !!esperado && apiKey === esperado;
}
