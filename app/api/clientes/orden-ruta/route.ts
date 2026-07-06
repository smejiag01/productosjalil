import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esquemaOrdenRuta } from "@/lib/validaciones";
import { requireAdmin } from "@/lib/auth-guard";

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const resultado = esquemaOrdenRuta.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: "Formato de orden inválido" },
        { status: 400 }
      );
    }

    const items = resultado.data;

    await prisma.$transaction(
      items.map((item) =>
        prisma.clientes.update({
          where: { id: item.id },
          data: { orden_ruta: item.orden_ruta },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al reordenar clientes de la ruta:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
