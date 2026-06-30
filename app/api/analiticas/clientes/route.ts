import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcularRango, toDbDate, toUtcInicioTs, toUtcFinTs } from "@/lib/analiticas/periodos";
import type { Periodo } from "@/lib/analiticas/periodos";

export const dynamic = "force-dynamic";

const esquema = z.object({
  periodo: z.enum(["diario", "semanal", "quincenal", "mensual"]).default("semanal"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const DIAS_INACTIVIDAD = 14;

type FilaCliente = { nombre: string; pedidos: number; total: number };
type FilaInactivo = { nombre: string; dias: number | null };

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const { periodo, fecha } = esquema.parse(params);
    const rango = calcularRango(periodo as Periodo, fecha);

    const [masActivos, nuevos, inactivos] = await Promise.all([
      prisma.$queryRaw<FilaCliente[]>`
        SELECT c.nombre,
               CAST(COUNT(p.id) AS INT) AS pedidos,
               CAST(SUM(p.total) AS FLOAT) AS total
        FROM pedidos p
        JOIN clientes c ON c.id = p.cliente_id
        WHERE p.fecha_pedido >= ${toDbDate(rango.inicio)}
          AND p.fecha_pedido <= ${toDbDate(rango.fin)}
        GROUP BY c.id, c.nombre
        ORDER BY total DESC
        LIMIT 10
      `,
      prisma.clientes.count({
        where: {
          created_at: {
            gte: toUtcInicioTs(rango.inicio),
            lte: toUtcFinTs(rango.fin),
          },
        },
      }),
      prisma.$queryRaw<FilaInactivo[]>`
        SELECT c.nombre,
               CAST(EXTRACT(day FROM NOW() - MAX(p.fecha_pedido::timestamp)) AS INT) AS dias
        FROM clientes c
        LEFT JOIN pedidos p ON p.cliente_id = c.id
        WHERE c.activo = true
        GROUP BY c.id, c.nombre
        HAVING MAX(p.fecha_pedido) < NOW() - make_interval(days => ${DIAS_INACTIVIDAD})
            OR MAX(p.fecha_pedido) IS NULL
        ORDER BY dias DESC NULLS LAST
        LIMIT 10
      `,
    ]);

    return NextResponse.json({
      success: true,
      data: {
        masActivos,
        nuevos,
        inactivos: inactivos.map((i) => ({
          nombre: i.nombre,
          dias: i.dias ?? null,
        })),
        diasInactividad: DIAS_INACTIVIDAD,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Parámetros inválidos" }, { status: 400 });
    }
    console.error("clientes analítica error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
