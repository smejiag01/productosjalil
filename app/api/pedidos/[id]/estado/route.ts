import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { esTransicionValida, type EstadoPedido } from "@/lib/pedidos";

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
// repartidor). Aquí es donde se debe enganchar más adelante el webhook de
// n8n para notificar al cliente por WhatsApp (ej. al pasar a en_reparto,
// entregado o devuelto), sin tener que tocar el resto del código.
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
      include: { ruta: true },
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

    if (!esTransicionValida(pedido.estado as EstadoPedido, nuevoEstado)) {
      return NextResponse.json(
        { success: false, error: `No se puede cambiar de "${pedido.estado}" a "${nuevoEstado}"` },
        { status: 422 }
      );
    }

    const ahora = new Date();
    const data: Record<string, unknown> = { estado: nuevoEstado };

    if (nuevoEstado === "confirmado") {
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

    return NextResponse.json({ success: true, data: pedidoActualizado });
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
