import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tipo } = body;

    const usuario = await prisma.usuarios.findUnique({
      where: { id: session.user.id },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (tipo === "correo") {
      const { nuevo_correo } = body;

      if (!nuevo_correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevo_correo)) {
        return NextResponse.json(
          { success: false, error: "Correo electrónico inválido" },
          { status: 400 }
        );
      }

      const existente = await prisma.usuarios.findUnique({
        where: { correo: nuevo_correo },
      });
      if (existente && existente.id !== usuario.id) {
        return NextResponse.json(
          { success: false, error: "Ese correo ya está en uso" },
          { status: 409 }
        );
      }

      await prisma.usuarios.update({
        where: { id: usuario.id },
        data: { correo: nuevo_correo },
      });

      return NextResponse.json({ success: true });
    }

    if (tipo === "password") {
      const { password_actual, password_nueva } = body;

      if (!password_actual || !password_nueva) {
        return NextResponse.json(
          { success: false, error: "Todos los campos son requeridos" },
          { status: 400 }
        );
      }

      if (password_nueva.length < 6) {
        return NextResponse.json(
          { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres" },
          { status: 400 }
        );
      }

      const passwordValido = await compare(
        password_actual,
        usuario.password_hash
      );
      if (!passwordValido) {
        return NextResponse.json(
          { success: false, error: "La contraseña actual es incorrecta" },
          { status: 403 }
        );
      }

      const nuevoHash = await hash(password_nueva, 12);
      await prisma.usuarios.update({
        where: { id: usuario.id },
        data: { password_hash: nuevoHash },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Tipo de actualización no válido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error al actualizar cuenta:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
