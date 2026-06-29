export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/",
    "/pedidos/:path*",
    "/productos/:path*",
    "/categorias/:path*",
    "/inventario/:path*",
    "/inventarios/:path*",
    "/clientes/:path*",
    "/rutas/:path*",
    "/empleados/:path*",
    "/configuracion/:path*",
  ],
};
