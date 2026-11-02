import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esquemaLoginTienda, telefonosCoinciden } from "@/lib/validaciones-tienda";
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

// Mensaje único para cualquier fallo de validación: no revela si el NIT
// existe, si el celular no coincide ni si hay datos ambiguos.
const ERROR_CREDENCIALES =
  "No pudimos validar tus datos. Revisa tu NIT y tu celular, o escríbenos por WhatsApp.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const resultado = esquemaLoginTienda.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: "Ingresa tu NIT y tu número de celular." },
        { status: 400 }
      );
    }

    const { nit, celular } = resultado.data;
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
    // espacios). Segundo factor: el celular debe ser uno de los números
    // registrados del cliente (principal o contactos autorizados).
    const candidatos = await prisma.clientes.findMany({
      where: { activo: true, nit },
      select: {
        id: true,
        telefono: true,
        cliente_contactos: { select: { telefono: true } },
      },
    });

    const coincidentes = candidatos.filter((c) =>
      [c.telefono, ...c.cliente_contactos.map((x) => x.telefono)].some((t) =>
        telefonosCoinciden(celular, t)
      )
    );

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
