import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const esquemaItemParcial = z.object({
  nombre: z.string().min(2).max(160).optional(),
  unidad: z.string().max(30).optional(),
  stock_minimo: z.number().min(0).optional(),
  costo_unitario: z.number().min(0).optional(),
  proveedor: z.string().max(120).optional().nullable(),
  tipo_animal: z.string().max(60).optional().nullable(),
  requiere_refrigeracion: z.boolean().optional(),
  fecha_vencimiento: z.string().optional().nullable(),
  producto_id: z.string().uuid().optional().nullable(),
  activo: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const resultado = esquemaItemParcial.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const existente = await prisma.inventario_items.findUnique({ where: { id: params.id } });
    if (!existente) {
      return NextResponse.json({ success: false, error: "Ítem no encontrado" }, { status: 404 });
    }

    const d = resultado.data;
    const data: Record<string, unknown> = { ...d };
    if (d.fecha_vencimiento !== undefined) {
      data.fecha_vencimiento = d.fecha_vencimiento ? new Date(d.fecha_vencimiento) : null;
    }

    const item = await prisma.inventario_items.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Error al actualizar ítem:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
