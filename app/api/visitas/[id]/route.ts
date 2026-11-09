import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

const esquema = z.object({ cliente_id: z.uuid().nullable() });

/** Enlaza (o desenlaza) una visita con el cliente que se creó a partir de ella. */
export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ success: false, error: "Visita no encontrada" }, { status: 404 });
  }

  const body = esquema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const visita = await prisma.visitas.findUnique({ where: { id }, select: { id: true } });
    if (!visita) {
      return NextResponse.json({ success: false, error: "Visita no encontrada" }, { status: 404 });
    }
    if (body.data.cliente_id) {
      const cliente = await prisma.clientes.findUnique({
        where: { id: body.data.cliente_id },
        select: { id: true },
      });
      if (!cliente) {
        return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 400 });
      }
    }
    const actualizada = await prisma.visitas.update({
      where: { id },
      data: { cliente_id: body.data.cliente_id },
      select: { id: true, cliente_id: true },
    });
    return NextResponse.json({ success: true, data: actualizada });
  } catch (error) {
    console.error("Error al actualizar visita:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
