import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { esTransicionValida, esRetrocesoValido, type EstadoPedido } from "@/lib/pedidos";
import { notificarDespachoWhatsApp } from "@/lib/notificaciones/notificarDespacho";

const ESTADOS_VALIDOS = [
  "pendiente",
  "en_proceso",
  "confirmado",
  "en_reparto",
  "entregado",
  "devuelto",
  "cancelado",
] as const;

const esquemaEstado = z
  .object({
    estado: z.enum(ESTADOS_VALIDOS, { error: "Estado inválido" }),
    motivo: z.string().max(1000).optional().nullable(),
  })
  .refine((d) => d.estado !== "devuelto" || !!d.motivo?.trim(), {
    message: "El motivo de la devolución es obligatorio",
    path: ["motivo"],
  });

// Endpoint único y centralizado para cambios de estado de pedido (admin y
// repartidor). Al pasar a en_reparto notifica por WhatsApp vía n8n (ver
// lib/notificaciones/notificarDespacho.ts); el despacho masivo por ruta
// (app/api/pedidos/despachar) notifica por su cuenta ya que no pasa por aquí.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const resultado = esquemaEstado.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: resultado.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const { estado: nuevoEstado, motivo } = resultado.data;

    const pedido = await prisma.pedidos.findUnique({
      where: { id: params.id },
      include: { ruta: true, cliente: true, items: true },
    });

    if (!pedido) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    if (session.user.rol === "repartidor") {
      if (!pedido.ruta || pedido.ruta.repartidor_id !== session.user.id) {
        return NextResponse.json(
          { success: false, error: "No tienes acceso a este pedido" },
          { status: 403 }
        );
      }
      if (nuevoEstado !== "entregado" && nuevoEstado !== "devuelto") {
        return NextResponse.json(
          { success: false, error: "Un repartidor solo puede marcar un pedido como entregado o devuelto" },
          { status: 403 }
        );
      }
    }

    const esAvance = esTransicionValida(pedido.estado as EstadoPedido, nuevoEstado);
    const esRetroceso = esRetrocesoValido(pedido.estado as EstadoPedido, nuevoEstado);

    if (!esAvance && !esRetroceso) {
      return NextResponse.json(
        { success: false, error: `No se puede cambiar de "${pedido.estado}" a "${nuevoEstado}"` },
        { status: 422 }
      );
    }

    const ahora = new Date();
    const data: Record<string, unknown> = { estado: nuevoEstado };

    // Al deshacer "entregado" -> "confirmado" nuevoEstado también es
    // "confirmado", pero eso es un retroceso, no una confirmación nueva: no
    // debe pisar la fecha original de confirmación (esAvance lo distingue).
    if (nuevoEstado === "confirmado" && esAvance) {
      data.confirmado_at = ahora;
    }
    if (nuevoEstado === "entregado") {
      data.entregado_at = ahora;
      data.entregado_por = session.user.id;
    }
    if (nuevoEstado === "devuelto") {
      data.devuelto_at = ahora;
      data.devuelto_por = session.user.id;
      data.devolucion_motivo = motivo;
    }

    const pedidoActualizado = await prisma.pedidos.update({
      where: { id: params.id },
      data,
    });

    // Al entregarse de verdad (no al deshacer hacia "entregado", eso no
    // existe) se descuenta el stock de producto terminado y queda un
    // movimiento con referencia al pedido — así se puede ver después en qué
    // pedido salió cada producto y cuánto.
    if (nuevoEstado === "entregado" && esAvance) {
      const cantidadPorProducto = new Map<string, number>();
      for (const item of pedido.items) {
        const actual = cantidadPorProducto.get(item.producto_id) ?? 0;
        cantidadPorProducto.set(item.producto_id, actual + Number(item.cantidad));
      }

      const productoIds = Array.from(cantidadPorProducto.keys());
      if (productoIds.length > 0) {
        const itemsInventario = await prisma.inventario_items.findMany({
          where: { producto_id: { in: productoIds }, tipo: "producto_terminado" },
        });

        if (itemsInventario.length > 0) {
          await prisma.$transaction(
            itemsInventario.flatMap((inv) => {
              const cantidad = cantidadPorProducto.get(inv.producto_id!)!;
              const cantidadAnterior = Number(inv.stock_actual);
              const cantidadNueva = cantidadAnterior - cantidad;
              return [
                prisma.inventario_movimientos.create({
                  data: {
                    item_id: inv.id,
                    tipo: "salida",
                    motivo: "venta",
                    cantidad,
                    cantidad_anterior: cantidadAnterior,
                    cantidad_nueva: cantidadNueva,
                    usuario_id: session.user.id,
                    referencia_tipo: "pedido",
                    referencia_id: pedido.id,
                  },
                }),
                prisma.inventario_items.update({
                  where: { id: inv.id },
                  data: { stock_actual: cantidadNueva },
                }),
              ];
            })
          );
        }
      }
    }

    // El repartidor puede marcar entregado/devuelto directo desde "confirmado"
    // (sin pasar por el despacho de ruta) cuando ya salió con el pedido antes
    // de que el admin despachara la ruta en el sistema. En ese caso el cliente
    // nunca recibió el aviso de "va en camino", así que lo disparamos aquí
    // para no perder esa notificación aunque el estado final sea devuelto.
    const saltoEnReparto =
      pedido.estado === "confirmado" &&
      (nuevoEstado === "entregado" || nuevoEstado === "devuelto");

    if (nuevoEstado === "en_reparto" || saltoEnReparto) {
      await notificarDespachoWhatsApp([
        { telefono: pedido.cliente.telefono, clienteNombre: pedido.cliente.nombre },
      ]);
    }

    return NextResponse.json({ success: true, data: pedidoActualizado });
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
