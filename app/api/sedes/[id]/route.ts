import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const esquemaSedeParcial = z.object({
  nombre_sede: z.string().min(2).max(120).optional(),
  direccion: z.string().optional().nullable(),
  latitud: z.number().min(-90).max(90).optional().nullable(),
  longitud: z.number().min(-180).max(180).optional().nullable(),
  es_principal: z.boolean().optional(),
  activa: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const resultado = esquemaSedeParcial.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const existente = await prisma.sedes.findUnique({ where: { id: params.id } });
    if (!existente) {
      return NextResponse.json({ success: false, error: "Sede no encontrada" }, { status: 404 });
    }

    const { es_principal, ...resto } = resultado.data;

    const sede = await prisma.$transaction(async (tx) => {
      if (es_principal === true) {
        await tx.sedes.updateMany({
          where: { cliente_id: existente.cliente_id, es_principal: true },
          data: { es_principal: false },
        });
      }

      return tx.sedes.update({
        where: { id: params.id },
        data: { ...resto, ...(es_principal !== undefined ? { es_principal } : {}) },
      });
    });

    return NextResponse.json({ success: true, data: sede });
  } catch (error) {
    console.error("Error al actualizar sede:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
