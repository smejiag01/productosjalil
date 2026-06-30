import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcularRango, toUtcInicioTs, toUtcFinTs } from "@/lib/analiticas/periodos";
import type { Periodo } from "@/lib/analiticas/periodos";

export const dynamic = "force-dynamic";

const esquema = z.object({
  periodo: z.enum(["diario", "semanal", "quincenal", "mensual"]).default("semanal"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

type FilaConsumo = { tipo: string; cantidad: number };
type FilaMerma = { nombre: string; cantidad: number; costo_total: number };
type FilaRotacion = { nombre: string; movimientos: number };

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const { periodo, fecha } = esquema.parse(params);
    const rango = calcularRango(periodo as Periodo, fecha);
    const inicio = toUtcInicioTs(rango.inicio);
    const fin = toUtcFinTs(rango.fin);

    const [consumoPorTipo, mermas, masRotacion, sinRotacion] = await Promise.all([
      prisma.$queryRaw<FilaConsumo[]>`
        SELECT ii.tipo,
               CAST(SUM(im.cantidad) AS FLOAT) AS cantidad
        FROM inventario_movimientos im
        JOIN inventario_items ii ON ii.id = im.item_id
        WHERE im.tipo = 'salida'
          AND im.created_at >= ${inicio}
          AND im.created_at <= ${fin}
        GROUP BY ii.tipo
        ORDER BY cantidad DESC
      `,
      prisma.$queryRaw<FilaMerma[]>`
        SELECT ii.nombre,
               CAST(SUM(im.cantidad) AS FLOAT) AS cantidad,
               CAST(SUM(im.cantidad * ii.costo_unitario) AS FLOAT) AS costo_total
        FROM inventario_movimientos im
        JOIN inventario_items ii ON ii.id = im.item_id
        WHERE im.motivo = 'merma'
          AND im.created_at >= ${inicio}
          AND im.created_at <= ${fin}
        GROUP BY ii.id, ii.nombre
        ORDER BY costo_total DESC
        LIMIT 10
      `,
      prisma.$queryRaw<FilaRotacion[]>`
        SELECT ii.nombre,
               CAST(COUNT(im.id) AS INT) AS movimientos
        FROM inventario_items ii
        LEFT JOIN inventario_movimientos im
          ON im.item_id = ii.id
          AND im.created_at >= ${inicio}
          AND im.created_at <= ${fin}
        WHERE ii.activo = true
        GROUP BY ii.id, ii.nombre
        HAVING COUNT(im.id) > 0
        ORDER BY movimientos DESC
        LIMIT 10
      `,
      prisma.$queryRaw<{ nombre: string }[]>`
        SELECT ii.nombre
        FROM inventario_items ii
        WHERE ii.activo = true
          AND NOT EXISTS (
            SELECT 1 FROM inventario_movimientos im
            WHERE im.item_id = ii.id
              AND im.created_at >= ${inicio}
              AND im.created_at <= ${fin}
          )
        ORDER BY ii.nombre
        LIMIT 10
      `,
    ]);

    const totalMermasCosto = mermas.reduce((s, m) => s + m.costo_total, 0);

    return NextResponse.json({
      success: true,
      data: {
        consumoPorTipo,
        mermas,
        totalMermasCosto,
        masRotacion,
        sinRotacion,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Parámetros inválidos" }, { status: 400 });
    }
    console.error("inventario analítica error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
