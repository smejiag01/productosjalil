import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { notificarDespachoWhatsApp } from "@/lib/notificaciones/notificarDespacho";

const esquemaDespacho = z.object({
  ruta_id: z.string().uuid("Ruta inválida"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
});

// Pasa a "en_reparto" todos los pedidos "confirmado" de una ruta en una
// fecha dada, para que el admin despache la ruta completa de una sola vez
// cuando el camión sale (en vez de tocar pedido por pedido).
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const resultado = esquemaDespacho.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: "Datos inválidos" },
        { status: 400 }
      );
    }

    const { ruta_id, fecha } = resultado.data;

    const ruta = await prisma.rutas.findUnique({ where: { id: ruta_id } });
    if (!ruta) {
      return NextResponse.json(
        { success: false, error: "Ruta no encontrada" },
        { status: 404 }
      );
    }

    const filtroDespacho = {
      ruta_id,
      fecha_pedido: new Date(fecha + "T00:00:00.000Z"),
      estado: "confirmado" as const,
    };

    // Prisma updateMany no soporta "returning", así que primero traemos los
    // pedidos que serán despachados (con su cliente) para poder notificar.
    const pedidosADespachar = await prisma.pedidos.findMany({
      where: filtroDespacho,
      include: { cliente: true },
    });

    const resultadoUpdate = await prisma.pedidos.updateMany({
      where: filtroDespacho,
      data: { estado: "en_reparto" },
    });

    await notificarDespachoWhatsApp(
      pedidosADespachar.map((p) => ({
        telefono: p.cliente.telefono,
        clienteNombre: p.cliente.nombre,
      }))
    );

    return NextResponse.json({
      success: true,
      data: { despachados: resultadoUpdate.count },
    });
  } catch (error) {
    console.error("Error al despachar ruta:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
