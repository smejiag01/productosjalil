import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const esquemaRuta = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  descripcion: z.string().optional().nullable(),
  dias_semana: z.array(z.number().int().min(0).max(6)).min(1, "Selecciona al menos un día"),
  empleado_id: z.string().uuid().optional().nullable(),
  activa: z.boolean().optional(),
});

export async function GET() {
  try {
    const rutas = await prisma.rutas.findMany({
      include: {
        empleado: { select: { id: true, nombre: true } },
        _count: { select: { clientes: true } },
      },
      orderBy: { nombre: "asc" },
    });

    const data = rutas.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      dias_semana: r.dias_semana,
      empleado: r.empleado,
      activa: r.activa,
      num_clientes: r._count.clientes,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error al listar rutas:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resultado = esquemaRuta.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const datos = resultado.data;
    const ruta = await prisma.rutas.create({
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion ?? null,
        dias_semana: datos.dias_semana,
        empleado_id: datos.empleado_id ?? null,
        activa: datos.activa ?? true,
      },
    });

    return NextResponse.json({ success: true, data: ruta }, { status: 201 });
  } catch (error) {
    console.error("Error al crear ruta:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
