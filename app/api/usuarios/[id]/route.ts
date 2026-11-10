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

const esquemaActualizar = z.object({
  documento: campoDocumento.optional(),
  nombre: z.string().min(2).max(120).optional(),
  correo: z.string().email("Correo inválido").max(160).optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  rol: z.enum(ROLES_VALIDOS, { error: "Rol inválido" }).optional(),
  activo: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
    if (!existente) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const { nombre, correo, documento, password, rol, activo } = resultado.data;
    if (
      documento &&
      (await prisma.usuarios.findFirst({ where: { documento, id: { not: params.id } }, select: { id: true } }))
    ) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario con ese documento" }, { status: 409 });
    }
    const esUnoMismo = params.id === auth.session.user.id;

    if (esUnoMismo && activo === false) {
      return NextResponse.json(
        { success: false, error: "No puedes desactivar tu propia cuenta" },
        { status: 400 }
      );
    }
    if (esUnoMismo && rol && rol !== "admin") {
      return NextResponse.json(
        { success: false, error: "No puedes quitarte a ti mismo el rol de administrador" },
        { status: 400 }
      );
    }

    // Si el cambio deja a un admin sin acceso (se desactiva o deja de ser admin),
    // verificar que quede al menos otro admin activo para no bloquear el sistema.
    const dejaDeSerAdminActivo =
      existente.rol === "admin" &&
      existente.activo &&
      ((activo === false) || (rol && rol !== "admin"));

    if (dejaDeSerAdminActivo) {
      const otrosAdminsActivos = await prisma.usuarios.count({
        where: { rol: "admin", activo: true, id: { not: params.id } },
      });
      if (otrosAdminsActivos === 0) {
        return NextResponse.json(
          { success: false, error: "Debe existir al menos un administrador activo" },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (correo !== undefined) data.correo = correo;
    if (documento !== undefined) data.documento = documento;
    if (rol !== undefined) data.rol = rol;
    if (activo !== undefined) data.activo = activo;
    if (password) data.password_hash = await hash(password, 12);

    const usuario = await prisma.usuarios.update({
      where: { id: params.id },
      data,
      select: { id: true, nombre: true, correo: true, documento: true, rol: true, activo: true, created_at: true },
    });

    return NextResponse.json({ success: true, data: usuario });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario con ese correo o documento" }, { status: 409 });
    }
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
