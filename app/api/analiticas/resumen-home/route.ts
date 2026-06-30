import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hoyStr, toDbDate, addDias } from "@/lib/analiticas/periodos";

export const dynamic = "force-dynamic";

type FilaVentas = { fecha: Date; total: number };
type AlertaRow = {
  id: string;
  nombre: string;
  tipo: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
};

export async function GET() {
  try {
    const hoy = hoyStr();
    const dbHoy = toDbDate(hoy);
    const hace6dias = addDias(hoy, -6);

    const [resumenHoy, pedidosPorEstado, pedidosHoyClientes, ventas7d, alertas] =
      await Promise.all([
        prisma.pedidos.aggregate({
          where: { fecha_pedido: dbHoy },
          _sum: { total: true },
          _count: { id: true },
        }),
        prisma.pedidos.groupBy({
          by: ["estado"],
          where: { fecha_pedido: dbHoy },
          _count: { id: true },
        }),
        prisma.pedidos.findMany({
          where: { fecha_pedido: dbHoy },
          select: { cliente_id: true },
        }),
        prisma.$queryRaw<FilaVentas[]>`
          SELECT fecha_pedido AS fecha, CAST(SUM(total) AS FLOAT) AS total
          FROM pedidos
          WHERE fecha_pedido >= ${toDbDate(hace6dias)}
            AND fecha_pedido <= ${dbHoy}
          GROUP BY fecha_pedido
          ORDER BY fecha_pedido
        `,
        prisma.$queryRaw<AlertaRow[]>`
          SELECT id::text, nombre, tipo, unidad,
                 CAST(stock_actual AS FLOAT) AS stock_actual,
                 CAST(stock_minimo AS FLOAT) AS stock_minimo
          FROM inventario_items
          WHERE activo = true AND stock_actual <= stock_minimo
          ORDER BY (CAST(stock_actual AS FLOAT) / NULLIF(CAST(stock_minimo AS FLOAT), 0)) ASC
          LIMIT 5
        `,
      ]);

    // Rellenar días sin ventas con 0
    const ventasPorDia = Array.from({ length: 7 }, (_, i) => {
      const fechaStr = addDias(hace6dias, i);
      const fila = ventas7d.find(
        (v) => v.fecha.toISOString().split("T")[0] === fechaStr
      );
      const [yy, mm, dd] = fechaStr.split("-").map(Number);
      const label = new Date(Date.UTC(yy, mm - 1, dd)).toLocaleDateString(
        "es-CO",
        { day: "numeric", month: "short", timeZone: "UTC" }
      );
      return { fecha: fechaStr, label, total: fila ? fila.total : 0 };
    });

    const clientesHoy = new Set(pedidosHoyClientes.map((p) => p.cliente_id)).size;

    return NextResponse.json({
      success: true,
      data: {
        ventasHoy: Number(resumenHoy._sum.total ?? 0),
        pedidosHoy: resumenHoy._count.id,
        clientesHoy,
        pedidosPorEstado: pedidosPorEstado.map((e) => ({
          estado: e.estado,
          count: e._count.id,
        })),
        ventas7dias: ventasPorDia,
        alertasInventario: alertas,
      },
    });
  } catch (error) {
    console.error("resumen-home error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
