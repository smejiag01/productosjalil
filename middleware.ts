export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/",
    "/pedidos/:path*",
    "/productos/:path*",
    "/inventario/:path*",
    "/clientes/:path*",
    "/rutas/:path*",
    "/empleados/:path*",
  ],
};
