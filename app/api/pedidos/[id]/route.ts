import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { esTransicionValida, type EstadoPedido } from "@/lib/pedidos";

const esquemaEstado = z.object({
  estado: z.enum([
    "pendiente",
    "en_proceso",
    "confirmado",
    "cancelado",
    "entregado",
  ]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const resultado = esquemaEstado.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Estado inválido. Valores permitidos: pendiente, en_proceso, confirmado, cancelado, entregado",
        },
        { status: 400 }
      );
    }

    const { estado: nuevoEstado } = resultado.data;

    const pedido = await prisma.pedidos.findUnique({
      where: { id: params.id },
    });

    if (!pedido) {
      return NextResponse.json(
        { success: false, error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (!esTransicionValida(pedido.estado as EstadoPedido, nuevoEstado)) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede cambiar de "${pedido.estado}" a "${nuevoEstado}"`,
        },
        { status: 422 }
      );
    }

    const pedidoActualizado = await prisma.pedidos.update({
      where: { id: params.id },
      data: {
        estado: nuevoEstado,
        confirmado_at:
          nuevoEstado === "confirmado" ? new Date() : pedido.confirmado_at,
      },
    });

    return NextResponse.json({ success: true, data: pedidoActualizado });
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
