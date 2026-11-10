import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { documentoValido, normalizarDocumento } from "@/lib/documento";

const ROLES_VALIDOS = ["admin", "repartidor", "vendedor"] as const;

const campoDocumento = z
  .string()
  .transform(normalizarDocumento)
  .refine(documentoValido, "El documento debe tener de 5 a 15 letras o números");

const esquemaUsuario = z.object({
  documento: campoDocumento,
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
        documento: true,
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

    const { nombre, correo, documento, password, rol, activo } = resultado.data;
    if (await prisma.usuarios.findFirst({ where: { documento }, select: { id: true } })) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario con ese documento" }, { status: 409 });
    }
    const password_hash = await hash(password, 12);

    const usuario = await prisma.usuarios.create({
      data: { nombre, correo, documento, password_hash, rol, activo: activo ?? true },
      select: { id: true, nombre: true, correo: true, documento: true, rol: true, activo: true, created_at: true },
    });

    return NextResponse.json({ success: true, data: usuario }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario con ese correo o documento" }, { status: 409 });
    }
    console.error("Error al crear usuario:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
