import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcularRango, toDbDate, addDias } from "@/lib/analiticas/periodos";
import type { Periodo } from "@/lib/analiticas/periodos";

export const dynamic = "force-dynamic";

const esquema = z.object({
  periodo: z.enum(["diario", "semanal", "quincenal", "mensual"]).default("semanal"),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

type FilaVentas = { fecha: Date; total: number; pedidos: number };

function diffDias(a: string, b: string): number {
  return (toDbDate(b).getTime() - toDbDate(a).getTime()) / 86400000;
}

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const { periodo, fecha } = esquema.parse(params);
    const rango = calcularRango(periodo as Periodo, fecha);

    const [serieActual, serieAnterior] = await Promise.all([
      prisma.$queryRaw<FilaVentas[]>`
        SELECT fecha_pedido AS fecha,
               CAST(SUM(total) AS FLOAT) AS total,
               CAST(COUNT(*) AS INT) AS pedidos
        FROM pedidos
        WHERE fecha_pedido >= ${toDbDate(rango.inicio)}
          AND fecha_pedido <= ${toDbDate(rango.fin)}
        GROUP BY fecha_pedido
        ORDER BY fecha_pedido
      `,
      prisma.$queryRaw<{ total: number; pedidos: number }[]>`
        SELECT CAST(SUM(total) AS FLOAT) AS total,
               CAST(COUNT(*) AS INT) AS pedidos
        FROM pedidos
        WHERE fecha_pedido >= ${toDbDate(rango.inicioAnterior)}
          AND fecha_pedido <= ${toDbDate(rango.finAnterior)}
      `,
    ]);

    // Rellenar días sin ventas
    const dias = diffDias(rango.inicio, rango.fin) + 1;
    const serie = Array.from({ length: dias }, (_, i) => {
      const fechaStr = addDias(rango.inicio, i);
      const fila = serieActual.find(
        (v) => v.fecha.toISOString().split("T")[0] === fechaStr
      );
      const [yy, mm, dd] = fechaStr.split("-").map(Number);
      const label = new Date(Date.UTC(yy, mm - 1, dd)).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });
      return { fecha: fechaStr, label, total: fila ? fila.total : 0 };
    });

    const totalPeriodo = serieActual.reduce((s, r) => s + r.total, 0);
    const totalPedidos = serieActual.reduce((s, r) => s + r.pedidos, 0);
    const totalAnterior = serieAnterior[0]?.total ?? 0;
    const pedidosAnterior = serieAnterior[0]?.pedidos ?? 0;
    const ticketPromedio = totalPedidos > 0 ? totalPeriodo / totalPedidos : 0;
    const variacion =
      totalAnterior > 0
        ? ((totalPeriodo - totalAnterior) / totalAnterior) * 100
        : totalPeriodo > 0
        ? 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        serie,
        totalPeriodo,
        ticketPromedio,
        totalAnterior,
        pedidosAnterior,
        variacion: Math.round(variacion * 10) / 10,
        label: rango.navLabel,
        labelAnterior: calcularRango(periodo as Periodo, rango.inicioAnterior).navLabel,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Parámetros inválidos" }, { status: 400 });
    }
    console.error("ventas analítica error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
