import { cookies } from "next/headers";
import CartProvider, { type ItemCarrito } from "./CartContext";
import { COOKIE_CARRITO } from "@/lib/tienda-session";

export const dynamic = "force-dynamic";

function leerCarritoInicial(): ItemCarrito[] {
  try {
    const raw = cookies().get(COOKIE_CARRITO)?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i) =>
          i &&
          typeof i.producto_id === "string" &&
          typeof i.cantidad === "number" &&
          i.cantidad > 0
      )
      .map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad }));
  } catch {
    return [];
  }
}

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider initialItems={leerCarritoInicial()}>{children}</CartProvider>
  );
}
