import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const esquemaEmpleado = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  cargo: z.string().max(80).optional().nullable(),
  telefono: z.string().max(40).optional().nullable(),
  activo: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const soloActivos = searchParams.get("activos") === "true";

    const empleados = await prisma.empleados.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ success: true, data: empleados });
  } catch (error) {
    console.error("Error al listar empleados:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resultado = esquemaEmpleado.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const empleado = await prisma.empleados.create({
      data: {
        nombre: resultado.data.nombre,
        cargo: resultado.data.cargo ?? null,
        telefono: resultado.data.telefono ?? null,
        activo: resultado.data.activo ?? true,
      },
    });

    return NextResponse.json({ success: true, data: empleado }, { status: 201 });
  } catch (error) {
    console.error("Error al crear empleado:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

