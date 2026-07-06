import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esquemaOrden } from "@/lib/validaciones-producto";
import { requireAdmin } from "@/lib/auth-guard";

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const resultado = esquemaOrden.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: "Formato de orden inválido" },
        { status: 400 }
      );
    }

    const items = resultado.data;

    await prisma.$transaction(
      items.map((item) =>
        prisma.productos.update({
          where: { id: item.id },
          data: { orden: item.orden },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al reordenar productos:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
