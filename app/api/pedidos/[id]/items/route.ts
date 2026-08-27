import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { esPedidoModificable, type EstadoPedido } from "@/lib/pedidos";

const esquemaItem = z.object({
  // Presente cuando es una línea que ya existía en el pedido (para conservar
  // su producto_nombre/precio_unitario históricos); ausente si es un producto
  // agregado en esta edición.
  id: z.string().uuid().optional(),
  producto_id: z.string().uuid(),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
});

const esquemaActualizarItems = z.object({
  items: z.array(esquemaItem),
});

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const resultado = esquemaActualizarItems.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const { items } = resultado.data;

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Un pedido no puede quedar sin productos. Si quieres eliminarlo, cancela el pedido en su lugar.",
        },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedidos.findUnique({ where: { id: params.id } });
    if (!pedido) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    if (!esPedidoModificable(pedido.estado as EstadoPedido)) {
      return NextResponse.json(
        { success: false, error: "Este pedido ya no se puede modificar" },
        { status: 400 }
      );
    }

    const productoIds = Array.from(new Set(items.map((i) => i.producto_id)));
    const productos = await prisma.productos.findMany({ where: { id: { in: productoIds } } });
    const productosMap = new Map(productos.map((p) => [p.id, p]));

    for (const it of items) {
      if (!productosMap.has(it.producto_id)) {
        return NextResponse.json({ success: false, error: "Uno de los productos ya no existe" }, { status: 400 });
      }
    }

    const idsExistentes = items.filter((i) => i.id).map((i) => i.id!);
    const itemsExistentesDb = idsExistentes.length
      ? await prisma.pedido_items.findMany({ where: { id: { in: idsExistentes }, pedido_id: params.id } })
      : [];
    const existentesMap = new Map(itemsExistentesDb.map((i) => [i.id, i]));

    const precios = await prisma.precios_cliente.findMany({
      where: { cliente_id: pedido.cliente_id, producto_id: { in: productoIds } },
    });
    const preciosMap = new Map(precios.map((p) => [p.producto_id, Number(p.precio)]));

    const filas = items.map((it) => {
      const existente = it.id ? existentesMap.get(it.id) : undefined;

      // Línea existente: la cantidad se puede cambiar, pero el nombre y el
      // precio quedan como se registraron en el pedido original (históricos).
      if (existente) {
        const precioUnitario = Number(existente.precio_unitario);
        return {
          producto_id: existente.producto_id,
          producto_nombre: existente.producto_nombre,
          cantidad: it.cantidad,
          precio_unitario: precioUnitario,
          subtotal: redondear(it.cantidad * precioUnitario),
        };
      }

      // Línea nueva: se fija el precio ahora mismo (precio del cliente si
      // existe, si no el precio base) y queda como histórico desde ya —
      // igual que cuando se crea un pedido nuevo.
      const producto = productosMap.get(it.producto_id)!;
      const precioUnitario = preciosMap.get(it.producto_id) ?? Number(producto.precio_base);
      return {
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        cantidad: it.cantidad,
        precio_unitario: precioUnitario,
        subtotal: redondear(it.cantidad * precioUnitario),
      };
    });

    const total = redondear(filas.reduce((suma, f) => suma + f.subtotal, 0));

    const pedidoActualizado = await prisma.$transaction(async (tx) => {
      await tx.pedido_items.deleteMany({ where: { pedido_id: params.id } });
      await tx.pedido_items.createMany({
        data: filas.map((f) => ({ ...f, pedido_id: params.id })),
      });
      return tx.pedidos.update({
        where: { id: params.id },
        data: { total },
        include: { items: { include: { producto: true } } },
      });
    });

    return NextResponse.json({ success: true, data: pedidoActualizado });
  } catch (error) {
    console.error("Error al modificar productos del pedido:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
