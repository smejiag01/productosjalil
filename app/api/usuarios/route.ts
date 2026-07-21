import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

const ROLES_VALIDOS = ["admin", "repartidor"] as const;

const esquemaUsuario = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  correo: z.string().email("Correo inválido").max(160),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol: z.enum(ROLES_VALIDOS, { error: "Rol inválido" }),
  activo: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const usuarios = await prisma.usuarios.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        activo: true,
        created_at: true,
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ success: true, data: usuarios });
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const resultado = esquemaUsuario.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const { nombre, correo, password, rol, activo } = resultado.data;
    const password_hash = await hash(password, 12);

    const usuario = await prisma.usuarios.create({
      data: { nombre, correo, password_hash, rol, activo: activo ?? true },
      select: { id: true, nombre: true, correo: true, rol: true, activo: true, created_at: true },
    });

    return NextResponse.json({ success: true, data: usuario }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario con ese correo" }, { status: 409 });
    }
    console.error("Error al crear usuario:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
