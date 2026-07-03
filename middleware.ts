import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const rol = req.nextauth.token?.rol;
    const pathname = req.nextUrl.pathname;

    // El repartidor solo puede ver su propio mini-dashboard
    if (rol === "repartidor" && !pathname.startsWith("/repartidor")) {
      return NextResponse.redirect(new URL("/repartidor", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

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
    "/configuracion/:path*",
    "/repartidor/:path*",
  ],
};
