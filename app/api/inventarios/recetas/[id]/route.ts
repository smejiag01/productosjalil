import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { INVENTARIO_MATERIA_PRIMA_HABILITADO, respuestaInventarioDeshabilitado } from "@/lib/inventario-flags";

const esquemaActualizar = z.object({
  cantidad_requerida: z.number().positive("La cantidad debe ser mayor a 0"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) return respuestaInventarioDeshabilitado();

  try {
    const body = await request.json();
    const resultado = esquemaActualizar.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const linea = await prisma.inventario_recetas.findUnique({ where: { id: params.id } });
    if (!linea) {
      return NextResponse.json({ success: false, error: "Línea de receta no encontrada" }, { status: 404 });
    }

    const actualizada = await prisma.inventario_recetas.update({
      where: { id: params.id },
      data: { cantidad_requerida: resultado.data.cantidad_requerida },
      include: { insumo: { select: { id: true, nombre: true, unidad: true, tipo: true, stock_actual: true } } },
    });

    return NextResponse.json({ success: true, data: actualizada });
  } catch (error) {
    console.error("Error al actualizar línea de receta:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) return respuestaInventarioDeshabilitado();

  try {
    const linea = await prisma.inventario_recetas.findUnique({ where: { id: params.id } });
    if (!linea) {
      return NextResponse.json({ success: false, error: "Línea de receta no encontrada" }, { status: 404 });
    }

    // Desactivar en vez de borrar, para no perder trazabilidad de producciones pasadas
    await prisma.inventario_recetas.update({
      where: { id: params.id },
      data: { activo: false },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("Error al quitar línea de receta:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
