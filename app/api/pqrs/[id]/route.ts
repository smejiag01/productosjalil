import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

const esquemaEstado = z.object({
  estado: z.enum(["pendiente", "en_revision", "resuelto"], {
    error: "Estado inválido. Valores permitidos: pendiente, en_revision, resuelto",
  }),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const pqr = await prisma.pqr.findUnique({
      where: { id: params.id },
      include: { cliente: true },
    });

    if (!pqr) {
      return NextResponse.json({ success: false, error: "PQR no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: pqr });
  } catch (error) {
    console.error("Error al obtener PQR:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const resultado = esquemaEstado.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: resultado.error.issues[0]?.message ?? "Estado inválido" },
        { status: 400 }
      );
    }

    const existente = await prisma.pqr.findUnique({ where: { id: params.id } });
    if (!existente) {
      return NextResponse.json({ success: false, error: "PQR no encontrado" }, { status: 404 });
    }

    const pqr = await prisma.pqr.update({
      where: { id: params.id },
      data: { estado: resultado.data.estado },
    });

    return NextResponse.json({ success: true, data: pqr });
  } catch (error) {
    console.error("Error al actualizar PQR:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
