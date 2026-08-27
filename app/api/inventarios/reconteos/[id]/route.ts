import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { INVENTARIO_MATERIA_PRIMA_HABILITADO, respuestaInventarioDeshabilitado } from "@/lib/inventario-flags";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) return respuestaInventarioDeshabilitado();

  try {
    const reconteo = await prisma.inventario_reconteos.findUnique({
      where: { id: params.id },
      include: {
        usuario: { select: { id: true, nombre: true } },
        detalles: {
          include: {
            item: { select: { id: true, nombre: true, tipo: true, unidad: true } },
          },
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!reconteo) {
      return NextResponse.json({ success: false, error: "Reconteo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: reconteo });
  } catch (error) {
    console.error("Error al obtener reconteo:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
