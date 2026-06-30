import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcularRango, toDbDate, addDias } from "@/lib/analiticas/periodos";
import type { Periodo } from "@/lib/analiticas/periodos";

export const dynamic = "force-dynamic";

const esquema = z.object({
  periodo: z.enum(["diario", "semanal", "quincenal", "mensual"]).default("semanal"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

type FilaEstado = { fecha: Date; estado: string; count: number };

function diffDias(a: string, b: string): number {
  return (toDbDate(b).getTime() - toDbDate(a).getTime()) / 86400000;
}

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const { periodo, fecha } = esquema.parse(params);
    const rango = calcularRango(periodo as Periodo, fecha);

    const [porEstado, seriePorEstado] = await Promise.all([
      prisma.pedidos.groupBy({
        by: ["estado"],
        where: {
          fecha_pedido: {
            gte: toDbDate(rango.inicio),
            lte: toDbDate(rango.fin),
          },
        },
        _count: { id: true },
      }),
      prisma.$queryRaw<FilaEstado[]>`
        SELECT fecha_pedido AS fecha, estado,
               CAST(COUNT(*) AS INT) AS count
        FROM pedidos
        WHERE fecha_pedido >= ${toDbDate(rango.inicio)}
          AND fecha_pedido <= ${toDbDate(rango.fin)}
        GROUP BY fecha_pedido, estado
        ORDER BY fecha_pedido
      `,
    ]);

    const totalPeriodo = porEstado.reduce((s, r) => s + r._count.id, 0);
    const cancelados = porEstado.find((r) => r.estado === "cancelado")?._count.id ?? 0;
    const tasaCancelacion =
      totalPeriodo > 0 ? Math.round((cancelados / totalPeriodo) * 1000) / 10 : 0;

    const estados = ["pendiente", "en_proceso", "confirmado", "cancelado", "entregado"];
    const dias = diffDias(rango.inicio, rango.fin) + 1;
    const serie = Array.from({ length: dias }, (_, i) => {
      const fechaStr = addDias(rango.inicio, i);
      const [yy, mm, dd] = fechaStr.split("-").map(Number);
      const label = new Date(Date.UTC(yy, mm - 1, dd)).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });
      const fila: Record<string, number | string> = { fecha: fechaStr, label };
      for (const est of estados) {
        const encontrado = seriePorEstado.find(
          (v) => v.fecha.toISOString().split("T")[0] === fechaStr && v.estado === est
        );
        fila[est] = encontrado ? encontrado.count : 0;
      }
      return fila;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalPeriodo,
        tasaCancelacion,
        cancelados,
        porEstado: porEstado.map((r) => ({ estado: r.estado, count: r._count.id })),
        serie,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Parámetros inválidos" }, { status: 400 });
    }
    console.error("pedidos analítica error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
