import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const esquemaEmpleadoParcial = z.object({
  nombre: z.string().min(2).max(120).optional(),
  cargo: z.string().max(80).optional().nullable(),
  telefono: z.string().max(40).optional().nullable(),
  activo: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const resultado = esquemaEmpleadoParcial.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const existente = await prisma.empleados.findUnique({ where: { id: params.id } });
    if (!existente) {
      return NextResponse.json({ success: false, error: "Empleado no encontrado" }, { status: 404 });
    }

    const empleado = await prisma.empleados.update({
      where: { id: params.id },
      data: resultado.data,
    });

    return NextResponse.json({ success: true, data: empleado });
  } catch (error) {
    console.error("Error al actualizar empleado:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existente = await prisma.empleados.findUnique({ where: { id: params.id } });
    if (!existente) {
      return NextResponse.json({ success: false, error: "Empleado no encontrado" }, { status: 404 });
    }

    const empleado = await prisma.empleados.update({
      where: { id: params.id },
      data: { activo: false },
    });

    return NextResponse.json({ success: true, data: empleado });
  } catch (error) {
    console.error("Error al desactivar empleado:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
