import CartProvider from "./CartContext";
import { leerCarritoCookie } from "@/lib/tienda-auth";

export const dynamic = "force-dynamic";

export default async function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const itemsIniciales = await leerCarritoCookie();
  return <CartProvider initialItems={itemsIniciales}>{children}</CartProvider>;
}
