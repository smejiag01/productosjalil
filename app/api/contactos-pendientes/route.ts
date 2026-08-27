import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const filtro = searchParams.get("filtro") ?? "pendientes";

    const where =
      filtro === "atendidos" ? { atendido: true } : filtro === "todos" ? {} : { atendido: false };

    const contactos = await prisma.contactos_pendientes.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ success: true, data: contactos });
  } catch (error) {
    console.error("Error al listar contactos pendientes:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
