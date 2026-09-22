import { encode, decode, type JWT } from "next-auth/jwt";

/**
 * Sesión de la TIENDA (clientes que entran con su NIT), totalmente separada de
 * la sesión de NextAuth del panel admin. Este archivo es "edge-safe": no importa
 * Prisma ni next/headers, así que puede usarse desde middleware.ts.
 *
 * Se reutiliza el encode/decode de next-auth/jwt (mismo mecanismo JWE que ya usa
 * NextAuth por debajo), pero firmado con un secreto DISTINTO —
 * TIENDA_SESSION_SECRET— para que ambas sesiones sean independientes.
 */

export const COOKIE_SESION_TIENDA = "tienda_session";
export const COOKIE_CARRITO = "tienda_carrito";

const MAX_AGE_SESION = 60 * 60 * 24 * 30; // 30 días
const MAX_AGE_CARRITO = 60 * 60 * 24 * 7; // 7 días

interface SesionCliente {
  clienteId: string;
}

function secretoTienda(): string {
  const secreto = process.env.TIENDA_SESSION_SECRET;
  if (!secreto) {
    throw new Error("Falta la variable de entorno TIENDA_SESSION_SECRET");
  }
  return secreto;
}

export async function crearTokenSesion(clienteId: string): Promise<string> {
  // El tipo JWT está augmentado (id/rol) para la sesión admin; el token de
  // tienda tiene otra forma, así que se castea explícitamente.
  return encode({
    token: { clienteId } as unknown as JWT,
    secret: secretoTienda(),
    maxAge: MAX_AGE_SESION,
  });
}

export async function leerTokenSesion(
  token: string | undefined
): Promise<SesionCliente | null> {
  if (!token) return null;
  try {
    const payload = await decode({ token, secret: secretoTienda() });
    if (payload && typeof payload.clienteId === "string") {
      return { clienteId: payload.clienteId };
    }
    return null;
  } catch {
    return null;
  }
}

type OpcionesCookie = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
};

export function opcionesCookieSesion(maxAge: number = MAX_AGE_SESION): OpcionesCookie {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function opcionesCookieCarrito(maxAge: number = MAX_AGE_CARRITO): OpcionesCookie {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}
