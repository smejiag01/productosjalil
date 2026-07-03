export { default } from "next-auth/middleware";

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
    "/configuracion/:path*",
  ],
};
