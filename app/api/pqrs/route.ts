import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ESTADOS_VALIDOS = ["pendiente", "en_revision", "resuelto"] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const pagina = Math.max(1, parseInt(searchParams.get("pagina") || "1"));
    const porPagina = 20;

    const where: Record<string, unknown> = {};
    if (estado && ESTADOS_VALIDOS.includes(estado as (typeof ESTADOS_VALIDOS)[number])) {
      where.estado = estado;
    }

    const [pqrs, total] = await Promise.all([
      prisma.pqr.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.pqr.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: pqrs,
      paginacion: { pagina, total, totalPaginas: Math.ceil(total / porPagina) },
    });
  } catch (error) {
    console.error("Error al listar PQRs:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
