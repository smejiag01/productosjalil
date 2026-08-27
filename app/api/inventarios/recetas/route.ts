import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { INVENTARIO_MATERIA_PRIMA_HABILITADO, respuestaInventarioDeshabilitado } from "@/lib/inventario-flags";

const esquemaReceta = z.object({
  producto_terminado_id: z.string().uuid("Producto terminado inválido"),
  insumo_id: z.string().uuid("Insumo inválido"),
  cantidad_requerida: z.number().positive("La cantidad debe ser mayor a 0"),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) return respuestaInventarioDeshabilitado();

  try {
    const { searchParams } = new URL(request.url);
    const productoTerminadoId = searchParams.get("producto_terminado_id");

    if (!productoTerminadoId) {
      return NextResponse.json(
        { success: false, error: "producto_terminado_id es requerido" },
        { status: 400 }
      );
    }

    const receta = await prisma.inventario_recetas.findMany({
      where: { producto_terminado_id: productoTerminadoId, activo: true },
      include: {
        insumo: { select: { id: true, nombre: true, unidad: true, tipo: true, stock_actual: true } },
      },
      orderBy: { created_at: "asc" },
    });

    return NextResponse.json({ success: true, data: receta });
  } catch (error) {
    console.error("Error al listar receta:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) return respuestaInventarioDeshabilitado();

  try {
    const body = await request.json();
    const resultado = esquemaReceta.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const { producto_terminado_id, insumo_id, cantidad_requerida } = resultado.data;

    if (producto_terminado_id === insumo_id) {
      return NextResponse.json(
        { success: false, error: "Un producto no puede ser insumo de sí mismo" },
        { status: 400 }
      );
    }

    const [productoTerminado, insumo] = await Promise.all([
      prisma.inventario_items.findUnique({ where: { id: producto_terminado_id } }),
      prisma.inventario_items.findUnique({ where: { id: insumo_id } }),
    ]);

    if (!productoTerminado || productoTerminado.tipo !== "producto_terminado") {
      return NextResponse.json({ success: false, error: "Producto terminado no encontrado" }, { status: 404 });
    }
    if (!insumo) {
      return NextResponse.json({ success: false, error: "Insumo no encontrado" }, { status: 404 });
    }

    // Si ya existe una línea (activa o inactiva) para ese par, la reactivamos/actualizamos
    const existente = await prisma.inventario_recetas.findUnique({
      where: { producto_terminado_id_insumo_id: { producto_terminado_id, insumo_id } },
    });

    const linea = existente
      ? await prisma.inventario_recetas.update({
          where: { id: existente.id },
          data: { cantidad_requerida, activo: true },
          include: { insumo: { select: { id: true, nombre: true, unidad: true, tipo: true, stock_actual: true } } },
        })
      : await prisma.inventario_recetas.create({
          data: { producto_terminado_id, insumo_id, cantidad_requerida },
          include: { insumo: { select: { id: true, nombre: true, unidad: true, tipo: true, stock_actual: true } } },
        });

    return NextResponse.json({ success: true, data: linea }, { status: 201 });
  } catch (error) {
    console.error("Error al crear línea de receta:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
