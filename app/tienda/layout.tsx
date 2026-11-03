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
};

export default async function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const itemsIniciales = await leerCarritoCookie();
  return <CartProvider initialItems={itemsIniciales}>{children}</CartProvider>;
}
