import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const esquemaRutaParcial = z.object({
  nombre: z.string().min(2).max(100).optional(),
  descripcion: z.string().optional().nullable(),
  dia_semana: z.number().int().min(0).max(6).optional(),
  empleado_id: z.string().uuid().optional().nullable(),
  activa: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ruta = await prisma.rutas.findUnique({
      where: { id: params.id },
      include: {
        empleado: { select: { id: true, nombre: true } },
        clientes: {
          select: { id: true, nombre: true, telefono: true, activo: true },
          orderBy: { nombre: "asc" },
        },
      },
    });

    if (!ruta) {
      return NextResponse.json({ success: false, error: "Ruta no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: ruta });
  } catch (error) {
    console.error("Error al obtener ruta:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const resultado = esquemaRutaParcial.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const existente = await prisma.rutas.findUnique({ where: { id: params.id } });
    if (!existente) {
      return NextResponse.json({ success: false, error: "Ruta no encontrada" }, { status: 404 });
    }

    const ruta = await prisma.rutas.update({
      where: { id: params.id },
      data: resultado.data,
    });

    return NextResponse.json({ success: true, data: ruta });
  } catch (error) {
    console.error("Error al actualizar ruta:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existente = await prisma.rutas.findUnique({ where: { id: params.id } });
    if (!existente) {
      return NextResponse.json({ success: false, error: "Ruta no encontrada" }, { status: 404 });
    }

    const ruta = await prisma.rutas.update({
      where: { id: params.id },
      data: { activa: false },
    });

    return NextResponse.json({ success: true, data: ruta });
  } catch (error) {
    console.error("Error al desactivar ruta:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
