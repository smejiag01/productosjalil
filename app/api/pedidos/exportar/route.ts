import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { ESTADOS, type EstadoPedido } from "@/lib/pedidos";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaParam = searchParams.get("fecha");
    const fecha = fechaParam || new Date().toISOString().split("T")[0];

    const pedidos = await prisma.pedidos.findMany({
      where: {
        fecha_pedido: new Date(fecha),
      },
      include: {
        cliente: true,
        ruta: true,
        items: {
          include: { producto: true },
        },
      },
      orderBy: { created_at: "asc" },
    });

    const filas: Record<string, string | number>[] = [];

    for (const pedido of pedidos) {
      for (const item of pedido.items) {
        filas.push({
          "Código Mekano": pedido.cliente.codigo_mekano ?? "",
          Cliente: pedido.cliente.nombre,
          Ruta: pedido.ruta?.nombre ?? "Sin ruta",
          Producto: item.producto_nombre,
          Cantidad: Number(item.cantidad),
          Unidad: item.producto?.unidad ?? "",
          "Precio Unitario": Number(item.precio_unitario),
          Subtotal: Number(item.subtotal),
          "Total Pedido": Number(pedido.total),
          Estado:
            ESTADOS[pedido.estado as EstadoPedido]?.label ?? pedido.estado,
          Fecha: fecha,
        });
      }
    }

    if (filas.length === 0) {
      filas.push({
        "Código Mekano": "",
        Cliente: "Sin pedidos para esta fecha",
        Ruta: "",
        Producto: "",
        Cantidad: 0,
        Unidad: "",
        "Precio Unitario": 0,
        Subtotal: 0,
        "Total Pedido": 0,
        Estado: "",
        Fecha: fecha,
      });
    }

    const ws = XLSX.utils.json_to_sheet(filas);

    const anchos = [
      { wch: 15 }, // Código Mekano
      { wch: 30 }, // Cliente
      { wch: 18 }, // Ruta
      { wch: 25 }, // Producto
      { wch: 10 }, // Cantidad
      { wch: 10 }, // Unidad
      { wch: 15 }, // Precio Unitario
      { wch: 15 }, // Subtotal
      { wch: 15 }, // Total Pedido
      { wch: 15 }, // Estado
      { wch: 12 }, // Fecha
    ];
    ws["!cols"] = anchos;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="pedidos-${fecha}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error al exportar pedidos:", error);
    return NextResponse.json(
      { success: false, error: "Error al generar el archivo Excel" },
      { status: 500 }
    );
  }
}
