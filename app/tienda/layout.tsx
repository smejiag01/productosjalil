import type { Metadata } from "next";
import CartProvider from "./CartContext";
import { leerCarritoCookie } from "@/lib/tienda-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Tienda en línea — Productos Jalil",
    template: "%s — Productos Jalil",
  },
  description: "Haz tu pedido de Productos Jalil en línea: precios para tu negocio, entrega según tu ruta.",
  // App instalable propia de los clientes: abre en /tienda (no en el login del personal).
  manifest: "/manifest-tienda.webmanifest",
  appleWebApp: { capable: true, title: "Jalil Pedidos", statusBarStyle: "default" },
};

export default async function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const itemsIniciales = await leerCarritoCookie();
  return <CartProvider initialItems={itemsIniciales}>{children}</CartProvider>;
}
