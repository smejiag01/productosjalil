import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

const esquemaActualizar = z.object({
  nombre: z.string().min(2).max(120).optional(),
  correo: z.string().email("Correo inválido").max(160).optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  activo: z.boolean().optional(),
  ruta_ids: z.array(z.string().uuid()).optional(),
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

    const existente = await prisma.usuarios.findUnique({ where: { id: params.id } });
    if (!existente || existente.rol !== "repartidor") {
      return NextResponse.json({ success: false, error: "Repartidor no encontrado" }, { status: 404 });
    }

    const { nombre, correo, password, activo, ruta_ids } = resultado.data;

    const data: Record<string, unknown> = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (correo !== undefined) data.correo = correo;
    if (activo !== undefined) data.activo = activo;
    if (password) data.password_hash = await hash(password, 12);

    const [repartidor] = await prisma.$transaction([
      prisma.usuarios.update({
        where: { id: params.id },
        data,
        select: { id: true, nombre: true, correo: true, activo: true, created_at: true },
      }),
      ...(ruta_ids !== undefined
        ? [
            prisma.rutas.updateMany({
              where: { repartidor_id: params.id, id: { notIn: ruta_ids } },
              data: { repartidor_id: null },
            }),
            prisma.rutas.updateMany({
              where: { id: { in: ruta_ids } },
              data: { repartidor_id: params.id },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true, data: repartidor });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario con ese correo" }, { status: 409 });
    }
    console.error("Error al actualizar repartidor:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
