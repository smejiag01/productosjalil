import { NextRequest, NextResponse } from "next/server";
import { requireClienteSession } from "@/lib/tienda-auth";
import { esquemaCarrito } from "@/lib/validaciones-tienda";
import { COOKIE_CARRITO, opcionesCookieCarrito } from "@/lib/tienda-session";

// Persiste el carrito (solo producto_id + cantidad, SIN precios) en una cookie
// httpOnly. El precio siempre se recalcula en el servidor al confirmar.
export async function PUT(request: NextRequest) {
  const auth = await requireClienteSession();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const resultado = esquemaCarrito.safeParse(body);
    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: "Carrito inválido" },
        { status: 400 }
      );
    }

    const respuesta = NextResponse.json({ success: true, data: { ok: true } });
    const items = resultado.data.items;
    if (items.length === 0) {
      respuesta.cookies.set(COOKIE_CARRITO, "", opcionesCookieCarrito(0));
    } else {
      respuesta.cookies.set(
        COOKIE_CARRITO,
        JSON.stringify(items),
        opcionesCookieCarrito()
      );
    }
    return respuesta;
  } catch (error) {
    console.error("Error al guardar carrito de tienda:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
