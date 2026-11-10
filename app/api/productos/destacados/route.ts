import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { esquemaDestacados } from "@/lib/destacados";

/**
 * Reemplaza la lista de destacados de la tienda: los ids recibidos quedan
 * destacados en ese orden y el resto deja de estarlo.
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const resultado = esquemaDestacados.safeParse(await request.json().catch(() => null));
  if (!resultado.success) {
    return NextResponse.json(
      { success: false, error: resultado.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { ids } = resultado.data;

  try {
    if (ids.length > 0) {
      const existentes = await prisma.productos.count({ where: { id: { in: ids } } });
      if (existentes !== ids.length) {
        return NextResponse.json({ success: false, error: "Algún producto ya no existe" }, { status: 400 });
      }
    }

    await prisma.$transaction([
      prisma.productos.updateMany({
        where: { destacado: true, id: { notIn: ids } },
        data: { destacado: false, orden_destacado: null },
      }),
      ...ids.map((id, i) =>
        prisma.productos.update({ where: { id }, data: { destacado: true, orden_destacado: i + 1 } })
      ),
    ]);

    return NextResponse.json({ success: true, data: { ids } });
  } catch (error) {
    console.error("Error al guardar destacados:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
