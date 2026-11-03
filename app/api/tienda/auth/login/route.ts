import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esquemaLoginTienda } from "@/lib/validaciones-tienda";
import {
  limpiarFallosNit,
  loginBloqueado,
  obtenerIp,
  registrarFalloLogin,
} from "@/lib/tienda-rate-limit";
import {
  COOKIE_SESION_TIENDA,
  crearTokenSesion,
  opcionesCookieSesion,
} from "@/lib/tienda-session";

// Mensaje único para cualquier fallo: no revela si el NIT no existe o si hay
// datos ambiguos (varios clientes con el mismo NIT).
const ERROR_CREDENCIALES =
  "No encontramos ese documento. Revísalo o escríbenos por WhatsApp.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const resultado = esquemaLoginTienda.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: "Ingresa tu NIT o número de documento." },
        { status: 400 }
      );
    }

    const { nit } = resultado.data;
    const ip = obtenerIp(request);

    if (await loginBloqueado(ip, nit)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Demasiados intentos. Espera unos minutos e inténtalo de nuevo, o escríbenos por WhatsApp.",
        },
        { status: 429 }
      );
    }

    // El NIT se guarda ya normalizado (sin dígito de verificación, puntos ni
    // espacios). Debe haber exactamente un cliente activo con ese NIT.
    const coincidentes = await prisma.clientes.findMany({
      where: { activo: true, nit },
      select: { id: true },
    });

    if (coincidentes.length !== 1) {
      await registrarFalloLogin(ip, nit);
      return NextResponse.json(
        { success: false, error: ERROR_CREDENCIALES },
        { status: 401 }
      );
    }

    await limpiarFallosNit(nit);

    const token = await crearTokenSesion(coincidentes[0].id);
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
