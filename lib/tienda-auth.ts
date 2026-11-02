import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_CARRITO,
  COOKIE_SESION_TIENDA,
  leerTokenSesion,
} from "@/lib/tienda-session";

/**
 * Helpers de sesión de tienda que SÍ tocan Prisma / next-headers. NO importar
 * desde middleware.ts (usa @/lib/tienda-session en su lugar, que es edge-safe).
 */

type ResultadoGuardiaCliente =
  | { clienteId: string; error: null }
  | { clienteId: null; error: NextResponse };

/** Para route handlers de /api/tienda: exige una sesión de cliente válida. */
export async function requireClienteSession(): Promise<ResultadoGuardiaCliente> {
  const token = (await cookies()).get(COOKIE_SESION_TIENDA)?.value;
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
 * Lee el carrito persistido en la cookie httpOnly (solo producto_id + cantidad,
 * sin precios). La cookie es editable por el navegador, así que se valida la
 * forma y se descarta lo inválido; el servidor igual revalida todo al confirmar.
 */
export async function leerCarritoCookie(): Promise<
  { producto_id: string; cantidad: number }[]
> {
  try {
    const raw = (await cookies()).get(COOKIE_CARRITO)?.value;
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i): i is { producto_id: string; cantidad: number } =>
          !!i &&
          typeof i.producto_id === "string" &&
          typeof i.cantidad === "number" &&
          i.cantidad > 0
      )
      .slice(0, 100)
      .map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad }));
  } catch {
    return [];
  }
}

/**
 * Para Server Components de /tienda: devuelve el cliente activo de la sesión,
 * o null si no hay sesión válida o el cliente fue archivado. Incluye la ruta.
 */
export async function obtenerClienteSesion() {
  const token = (await cookies()).get(COOKIE_SESION_TIENDA)?.value;
  const sesion = await leerTokenSesion(token);
  if (!sesion) return null;
  return prisma.clientes.findFirst({
    where: { id: sesion.clienteId, activo: true },
    include: { ruta: true },
  });
}
