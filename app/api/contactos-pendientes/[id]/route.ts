import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

const esquemaActualizar = z.object({
  atendido: z.boolean().optional(),
  notas: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const resultado = esquemaActualizar.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const existente = await prisma.contactos_pendientes.findUnique({ where: { id: params.id } });
    if (!existente) {
      return NextResponse.json({ success: false, error: "Contacto no encontrado" }, { status: 404 });
    }

    const { atendido, notas } = resultado.data;
    const data: Record<string, unknown> = {};

    if (atendido !== undefined) {
      data.atendido = atendido;
      data.atendido_at = atendido ? new Date() : null;
    }
    if (notas !== undefined) {
      data.notas = notas;
    }

    const contacto = await prisma.contactos_pendientes.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, data: contacto });
  } catch (error) {
    console.error("Error al actualizar contacto pendiente:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
