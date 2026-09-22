import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_SESION_TIENDA, leerTokenSesion } from "@/lib/tienda-session";

/**
 * Helpers de sesión de tienda que SÍ tocan Prisma / next-headers. NO importar
 * desde middleware.ts (usa @/lib/tienda-session en su lugar, que es edge-safe).
 */

type ResultadoGuardiaCliente =
  | { clienteId: string; error: null }
  | { clienteId: null; error: NextResponse };

/** Para route handlers de /api/tienda: exige una sesión de cliente válida. */
export async function requireClienteSession(): Promise<ResultadoGuardiaCliente> {
  const token = cookies().get(COOKIE_SESION_TIENDA)?.value;
  const sesion = await leerTokenSesion(token);
  if (!sesion) {
    return {
      clienteId: null,
      error: NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      ),
    };
  }
  return { clienteId: sesion.clienteId, error: null };
}

/**
 * Para Server Components de /tienda: devuelve el cliente activo de la sesión,
 * o null si no hay sesión válida o el cliente fue archivado. Incluye la ruta.
 */
export async function obtenerClienteSesion() {
  const token = cookies().get(COOKIE_SESION_TIENDA)?.value;
  const sesion = await leerTokenSesion(token);
  if (!sesion) return null;
  return prisma.clientes.findFirst({
    where: { id: sesion.clienteId, activo: true },
    include: { ruta: true },
  });
}
