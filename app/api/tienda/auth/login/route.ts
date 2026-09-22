import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esquemaLoginNit } from "@/lib/validaciones-tienda";
import {
  COOKIE_SESION_TIENDA,
  crearTokenSesion,
  opcionesCookieSesion,
} from "@/lib/tienda-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resultado = esquemaLoginNit.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: "Ingresa tu NIT o número de documento" },
        { status: 400 }
      );
    }

    const { nit } = resultado.data;

    // Los NIT se guardan ya normalizados (sin dígito de verificación, sin
    // puntos ni espacios), así que se compara contra el valor normalizado.
    const clientes = await prisma.clientes.findMany({
      where: { activo: true, nit },
      select: { id: true },
    });

    if (clientes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No encontramos ese documento. Comunícate con nosotros.",
        },
        { status: 404 }
      );
    }

    if (clientes.length > 1) {
      // Dato ambiguo: no adivinamos cuál cliente es.
      return NextResponse.json(
        {
          success: false,
          error:
            "Encontramos más de una cuenta con ese documento. Comunícate con nosotros.",
        },
        { status: 409 }
      );
    }

    const token = await crearTokenSesion(clientes[0].id);
    const respuesta = NextResponse.json({ success: true, data: { ok: true } });
    respuesta.cookies.set(COOKIE_SESION_TIENDA, token, opcionesCookieSesion());
    return respuesta;
  } catch (error) {
    console.error("Error en login de tienda:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
