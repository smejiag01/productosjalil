import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcularRango, toDbDate } from "@/lib/analiticas/periodos";
import type { Periodo } from "@/lib/analiticas/periodos";

export const dynamic = "force-dynamic";

const esquema = z.object({
  periodo: z.enum(["diario", "semanal", "quincenal", "mensual"]).default("semanal"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

type FilaProducto = { nombre: string; cantidad: number; ingresos: number };

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const { periodo, fecha } = esquema.parse(params);
    const rango = calcularRango(periodo as Periodo, fecha);

    const [topProductos, todosProductos] = await Promise.all([
      prisma.$queryRaw<FilaProducto[]>`
        SELECT pi.producto_nombre AS nombre,
               CAST(SUM(pi.cantidad) AS FLOAT) AS cantidad,
               CAST(SUM(pi.subtotal) AS FLOAT) AS ingresos
        FROM pedido_items pi
        JOIN pedidos p ON p.id = pi.pedido_id
        WHERE p.fecha_pedido >= ${toDbDate(rango.inicio)}
          AND p.fecha_pedido <= ${toDbDate(rango.fin)}
        GROUP BY pi.producto_nombre
        ORDER BY ingresos DESC
        LIMIT 10
      `,
      prisma.$queryRaw<{ nombre: string; cantidad: number }[]>`
        SELECT pi.producto_nombre AS nombre,
               CAST(COALESCE(SUM(pi.cantidad), 0) AS FLOAT) AS cantidad
        FROM pedido_items pi
        JOIN pedidos p ON p.id = pi.pedido_id
        WHERE p.fecha_pedido >= ${toDbDate(rango.inicio)}
          AND p.fecha_pedido <= ${toDbDate(rango.fin)}
        GROUP BY pi.producto_nombre
        HAVING SUM(pi.cantidad) < 2
        ORDER BY cantidad ASC
        LIMIT 10
      `,
    ]);

    return NextResponse.json({
      success: true,
      data: {
        topProductos,
        bajaRotacion: todosProductos,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Parámetros inválidos" }, { status: 400 });
    }
    console.error("productos analítica error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
