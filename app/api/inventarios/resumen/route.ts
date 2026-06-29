import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.inventario_items.findMany({
      where: { activo: true },
      select: { tipo: true, stock_actual: true, stock_minimo: true, costo_unitario: true },
    });

    const tipos = ["insumo", "materia_prima", "producto_terminado"] as const;
    const resumen = tipos.map((tipo) => {
      const del_tipo = items.filter((i) => i.tipo === tipo);
      const bajo_stock = del_tipo.filter((i) => Number(i.stock_actual) <= Number(i.stock_minimo));
      const valor_total = del_tipo.reduce(
        (sum, i) => sum + Number(i.stock_actual) * Number(i.costo_unitario),
        0
      );

      return {
        tipo,
        total_items: del_tipo.length,
        bajo_stock: bajo_stock.length,
        valor_total,
      };
    });

    const alertas = await prisma.inventario_items.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, tipo: true, unidad: true, stock_actual: true, stock_minimo: true },
    });

    const items_alerta = alertas
      .filter((i) => Number(i.stock_actual) <= Number(i.stock_minimo))
      .map((i) => ({
        ...i,
        stock_actual: Number(i.stock_actual),
        stock_minimo: Number(i.stock_minimo),
      }));

    return NextResponse.json({ success: true, data: { resumen, alertas: items_alerta } });
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
