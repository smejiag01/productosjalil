import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const TIPOS_VALIDOS = ["insumo", "materia_prima", "producto_terminado"] as const;
const UNIDADES_VALIDAS = ["kg", "unidad", "caja", "libra", "arroba", "litro", "gramo"] as const;

const esquemaItem = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(160),
  tipo: z.enum(TIPOS_VALIDOS, { error: "Tipo inválido" }),
  unidad: z.enum(UNIDADES_VALIDAS, { error: "Unidad inválida" }),
  stock_actual: z.number().min(0).optional(),
  stock_minimo: z.number().min(0).optional(),
  costo_unitario: z.number().min(0).optional(),
  proveedor: z.string().max(120).optional().nullable(),
  tipo_animal: z.string().max(60).optional().nullable(),
  requiere_refrigeracion: z.boolean().optional(),
  fecha_vencimiento: z.string().optional().nullable(),
  producto_id: z.string().uuid().optional().nullable(),
  activo: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const activo = searchParams.get("activo");
    const alerta = searchParams.get("alerta");

    const where: Record<string, unknown> = {};
    if (tipo && TIPOS_VALIDOS.includes(tipo as typeof TIPOS_VALIDOS[number])) {
      where.tipo = tipo;
    }
    if (activo !== null && activo !== "") where.activo = activo !== "false";
    if (alerta === "true") {
      where.stock_actual = { lte: prisma.inventario_items.fields.stock_minimo };
    }

    const items = await prisma.inventario_items.findMany({
      where: alerta === "true"
        ? { ...where, stock_actual: undefined }
        : where,
      include: {
        producto: { select: { id: true, nombre: true } },
      },
      orderBy: { nombre: "asc" },
    });

    const data = alerta === "true"
      ? items.filter((i) => Number(i.stock_actual) <= Number(i.stock_minimo))
      : items;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error al listar ítems de inventario:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resultado = esquemaItem.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const d = resultado.data;

    const item = await prisma.inventario_items.create({
      data: {
        nombre: d.nombre,
        tipo: d.tipo,
        unidad: d.unidad,
        stock_actual: d.stock_actual ?? 0,
        stock_minimo: d.stock_minimo ?? 0,
        costo_unitario: d.costo_unitario ?? 0,
        proveedor: d.tipo === "insumo" ? (d.proveedor ?? null) : null,
        tipo_animal: d.tipo === "materia_prima" ? (d.tipo_animal ?? null) : null,
        requiere_refrigeracion: d.tipo === "materia_prima" ? (d.requiere_refrigeracion ?? false) : false,
        fecha_vencimiento: d.fecha_vencimiento ? new Date(d.fecha_vencimiento) : null,
        producto_id: d.tipo === "producto_terminado" ? (d.producto_id ?? null) : null,
        activo: d.activo ?? true,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("Error al crear ítem:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
