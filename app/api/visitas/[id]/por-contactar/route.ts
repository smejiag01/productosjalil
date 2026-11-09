import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { notasContactoDesdeVisita } from "@/lib/visitas";

/**
 * Manda una visita a "Por contactar" para que alguien la llame. Si ya se
 * había enviado, devuelve el mismo registro (no duplica).
 */
export async function POST(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ success: false, error: "Visita no encontrada" }, { status: 404 });
  }

  try {
    const visita = await prisma.visitas.findUnique({
      where: { id },
      include: { vendedor: { select: { nombre: true } } },
    });
    if (!visita) {
      return NextResponse.json({ success: false, error: "Visita no encontrada" }, { status: 404 });
    }
    if (visita.contacto_pendiente_id) {
      return NextResponse.json({
        success: true,
        data: { contacto_pendiente_id: visita.contacto_pendiente_id },
      });
    }
    const telefono = visita.telefono;
    if (!telefono) {
      return NextResponse.json(
        { success: false, error: "La visita no tiene teléfono; no se puede enviar a Por contactar" },
        { status: 400 }
      );
    }

    const contacto = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.contactos_pendientes.create({
        data: {
          telefono,
          nombre_perfil: visita.nombre_empresa,
          motivo: "visita_vendedor",
          telefono_contacto: telefono,
          notas: notasContactoDesdeVisita({ ...visita, vendedor: visita.vendedor.nombre }),
        },
        select: { id: true },
      });
      await tx.visitas.update({ where: { id }, data: { contacto_pendiente_id: nuevo.id } });
      return nuevo;
    });

    return NextResponse.json(
      { success: true, data: { contacto_pendiente_id: contacto.id } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al enviar visita a Por contactar:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
