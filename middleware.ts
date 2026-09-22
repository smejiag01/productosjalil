import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { COOKIE_SESION_TIENDA, leerTokenSesion } from "@/lib/tienda-session";

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // --- Rama TIENDA: se resuelve y retorna ANTES de tocar la lógica admin ---
  // El código de admin/repartidor NUNCA se ejecuta para rutas /tienda.
  if (pathname.startsWith("/tienda")) {
    if (pathname.startsWith("/tienda/login")) {
      return NextResponse.next();
    }
    const tokenTienda = req.cookies.get(COOKIE_SESION_TIENDA)?.value;
    const sesion = await leerTokenSesion(tokenTienda);
    if (!sesion) {
      return NextResponse.redirect(new URL("/tienda/login", req.url));
    }
    return NextResponse.next();
  }

  // --- Rama ADMIN / REPARTIDOR (lógica previa de withAuth, preservada literal) ---
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Equivale a `authorized: ({ token }) => !!token`: sin token, al login admin.
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  const rol = (token as { rol?: string }).rol;

  // El repartidor solo puede ver su propio mini-dashboard
  if (rol === "repartidor" && !pathname.startsWith("/repartidor")) {
    return NextResponse.redirect(new URL("/repartidor", req.url));
  }

  // El admin no debe quedar "atrapado" en la vista de repartidor
  if (rol === "admin" && pathname.startsWith("/repartidor")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/pedidos/:path*",
    "/analiticas/:path*",
    "/productos/:path*",
    "/categorias/:path*",
    "/inventario/:path*",
    "/inventarios/:path*",
    "/clientes/:path*",
    "/pqrs/:path*",
    "/rutas/:path*",
    "/empleados/:path*",
    "/repartidores/:path*",
    "/usuarios/:path*",
    "/contactos-pendientes/:path*",
    "/configuracion/:path*",
    "/repartidor/:path*",
    "/tienda/:path*",
  ],
};
