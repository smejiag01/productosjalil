import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

const esquemaSede = z.object({
  nombre_sede: z.string().min(2, "El nombre de la sede debe tener al menos 2 caracteres").max(120),
  direccion: z.string().optional().nullable(),
  latitud: z.number().min(-90).max(90).optional().nullable(),
  longitud: z.number().min(-180).max(180).optional().nullable(),
  es_principal: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const sedes = await prisma.sedes.findMany({
      where: { cliente_id: params.id },
      orderBy: [{ es_principal: "desc" }, { nombre_sede: "asc" }],
    });

    return NextResponse.json({ success: true, data: sedes });
  } catch (error) {
    console.error("Error al listar sedes:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const resultado = esquemaSede.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const cliente = await prisma.clientes.findUnique({ where: { id: params.id } });
    if (!cliente) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    }

    const { nombre_sede, direccion, latitud, longitud, es_principal } = resultado.data;

    const totalSedes = await prisma.sedes.count({ where: { cliente_id: params.id } });
    // La primera sede de un cliente siempre queda como principal
    const marcarPrincipal = totalSedes === 0 || es_principal === true;

    const sede = await prisma.$transaction(async (tx) => {
      if (marcarPrincipal) {
        await tx.sedes.updateMany({
          where: { cliente_id: params.id, es_principal: true },
          data: { es_principal: false },
        });
      }

      return tx.sedes.create({
        data: {
          cliente_id: params.id,
          nombre_sede,
          direccion: direccion ?? null,
          latitud: latitud ?? null,
          longitud: longitud ?? null,
          es_principal: marcarPrincipal,
        },
      });
    });

    return NextResponse.json({ success: true, data: sede }, { status: 201 });
  } catch (error) {
    console.error("Error al crear sede:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
