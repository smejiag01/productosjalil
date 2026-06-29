import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as XLSX from "xlsx";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const TIPOS_MOV = ["entrada", "salida", "ajuste"] as const;
const MOTIVOS = ["compra", "venta", "merma", "produccion", "ajuste_manual"] as const;

const esquemaMovimiento = z.object({
  item_id: z.string().uuid("Ítem inválido"),
  tipo: z.enum(TIPOS_MOV, { error: "Tipo de movimiento inválido" }),
  motivo: z.enum(MOTIVOS, { error: "Motivo inválido" }),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
  notas: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipoInv = searchParams.get("tipo_inventario");
    const tipoMov = searchParams.get("tipo_movimiento");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const pagina = Math.max(1, parseInt(searchParams.get("pagina") || "1"));
    const exportar = searchParams.get("exportar") === "true";
    const porPagina = exportar ? 10000 : 20;

    const where: Record<string, unknown> = {};
    if (tipoMov) where.tipo = tipoMov;
    if (tipoInv) where.item = { tipo: tipoInv };
    if (desde || hasta) {
      const fechaFiltro: Record<string, Date> = {};
      if (desde) fechaFiltro.gte = new Date(desde + "T00:00:00.000Z");
      if (hasta) fechaFiltro.lte = new Date(hasta + "T23:59:59.999Z");
      where.created_at = fechaFiltro;
    }

    const [movimientos, total] = await Promise.all([
      prisma.inventario_movimientos.findMany({
        where,
        include: {
          item: { select: { id: true, nombre: true, tipo: true, unidad: true } },
          usuario: { select: { id: true, nombre: true } },
        },
        orderBy: { created_at: "desc" },
        skip: exportar ? 0 : (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.inventario_movimientos.count({ where }),
    ]);

    if (exportar) {
      const LABELS_TIPO: Record<string, string> = { insumo: "Insumo", materia_prima: "Materia prima", producto_terminado: "Producto terminado" };
      const filas = movimientos.map((m) => ({
        Fecha: m.created_at.toLocaleString("es-CO", { timeZone: "America/Bogota" }),
        Ítem: m.item.nombre,
        "Tipo inventario": LABELS_TIPO[m.item.tipo] ?? m.item.tipo,
        "Tipo movimiento": m.tipo,
        Motivo: m.motivo,
        Cantidad: Number(m.cantidad),
        "Stock anterior": Number(m.cantidad_anterior),
        "Stock nuevo": Number(m.cantidad_nueva),
        Unidad: m.item.unidad,
        Notas: m.notas ?? "",
        Usuario: m.usuario?.nombre ?? "",
      }));

      const ws = XLSX.utils.json_to_sheet(filas.length > 0 ? filas : [{ Fecha: "", Ítem: "Sin movimientos", "Tipo inventario": "", "Tipo movimiento": "", Motivo: "", Cantidad: 0, "Stock anterior": 0, "Stock nuevo": 0, Unidad: "", Notas: "", Usuario: "" }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="movimientos-inventario.xlsx"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: movimientos,
      paginacion: { pagina, total, totalPaginas: Math.ceil(total / porPagina) },
    });
  } catch (error) {
    console.error("Error al listar movimientos:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const resultado = esquemaMovimiento.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const { item_id, tipo, motivo, cantidad, notas } = resultado.data;

    const item = await prisma.inventario_items.findUnique({ where: { id: item_id } });
    if (!item) {
      return NextResponse.json({ success: false, error: "Ítem no encontrado" }, { status: 404 });
    }

    const stockAnterior = Number(item.stock_actual);
    let stockNuevo: number;

    if (tipo === "entrada") {
      stockNuevo = stockAnterior + cantidad;
    } else if (tipo === "salida") {
      stockNuevo = stockAnterior - cantidad;
      if (stockNuevo < 0) {
        return NextResponse.json(
          { success: false, error: `Stock insuficiente. Stock actual: ${stockAnterior} ${item.unidad}` },
          { status: 400 }
        );
      }
    } else {
      stockNuevo = cantidad;
    }

    const [itemActualizado, movimiento] = await prisma.$transaction([
      prisma.inventario_items.update({
        where: { id: item_id },
        data: { stock_actual: stockNuevo },
      }),
      prisma.inventario_movimientos.create({
        data: {
          item_id,
          tipo,
          motivo,
          cantidad,
          cantidad_anterior: stockAnterior,
          cantidad_nueva: stockNuevo,
          notas: notas ?? null,
          usuario_id: session?.user?.id ?? null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { movimiento, item: itemActualizado },
    }, { status: 201 });
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
