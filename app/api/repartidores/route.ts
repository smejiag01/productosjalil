import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const esquemaRepartidor = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  correo: z.string().email("Correo inválido").max(160),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  activo: z.boolean().optional(),
  ruta_ids: z.array(z.string().uuid()).optional(),
});

export async function GET() {
  try {
    const repartidores = await prisma.usuarios.findMany({
      where: { rol: "repartidor" },
      select: {
        id: true,
        nombre: true,
        correo: true,
        activo: true,
        created_at: true,
        rutas_asignadas: { select: { id: true, nombre: true } },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ success: true, data: repartidores });
  } catch (error) {
    console.error("Error al listar repartidores:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resultado = esquemaRepartidor.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const { nombre, correo, password, activo, ruta_ids } = resultado.data;
    const password_hash = await hash(password, 12);

    const repartidor = await prisma.usuarios.create({
      data: { nombre, correo, password_hash, rol: "repartidor", activo: activo ?? true },
      select: { id: true, nombre: true, correo: true, activo: true, created_at: true },
    });

    if (ruta_ids && ruta_ids.length > 0) {
      await prisma.rutas.updateMany({
        where: { id: { in: ruta_ids } },
        data: { repartidor_id: repartidor.id },
      });
    }

    return NextResponse.json({ success: true, data: repartidor }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario con ese correo" }, { status: 409 });
    }
    console.error("Error al crear repartidor:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
