import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClienteSession } from "@/lib/tienda-auth";
import { precioEfectivo, resolverPreciosCliente } from "@/lib/precios";

// Devuelve el último pedido del cliente como propuesta de carrito, con precios
// RECALCULADos a hoy y descartando productos ya inactivos (reportándolos por
// nombre). El cliente igual debe confirmar en el carrito: nunca se crea pedido.
export async function GET() {
  const auth = await requireClienteSession();
  if (auth.error) return auth.error;
  const clienteId = auth.clienteId;

  try {
    const ultimo = await prisma.pedidos.findFirst({
      where: { cliente_id: clienteId },
      orderBy: { created_at: "desc" },
      include: { items: true },
    });

    if (!ultimo) {
      return NextResponse.json({
        success: true,
        data: { items: [], removidos: [] },
      });
    }

    // Consolidar por producto (por si aparece en varias líneas).
    const cantidadPorProducto = new Map<string, number>();
    const nombreHistorico = new Map<string, string>();
    for (const it of ultimo.items) {
      cantidadPorProducto.set(
        it.producto_id,
        (cantidadPorProducto.get(it.producto_id) ?? 0) + Number(it.cantidad)
      );
      if (!nombreHistorico.has(it.producto_id)) {
        nombreHistorico.set(it.producto_id, it.producto_nombre);
      }
    }

    const productoIds = Array.from(cantidadPorProducto.keys());
    const productos = await prisma.productos.findMany({
      where: { id: { in: productoIds } },
    });
    const productosMap = new Map(productos.map((p) => [p.id, p]));
    const preciosMap = await resolverPreciosCliente(clienteId, productoIds);

    const items: {
      producto_id: string;
      producto_nombre: string;
      cantidad: number;
      precio_unitario: number;
    }[] = [];
    const removidos: string[] = [];

    for (const [pid, cantidad] of Array.from(cantidadPorProducto.entries())) {
      const p = productosMap.get(pid);
      if (!p || !p.activo) {
        removidos.push(nombreHistorico.get(pid) ?? "Producto");
        continue;
      }
      items.push({
        producto_id: pid,
        producto_nombre: p.nombre,
        cantidad,
        precio_unitario: precioEfectivo(Number(p.precio_base), preciosMap.get(pid)),
      });
    }

    return NextResponse.json({ success: true, data: { items, removidos } });
  } catch (error) {
    console.error("Error al obtener último pedido de tienda:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
