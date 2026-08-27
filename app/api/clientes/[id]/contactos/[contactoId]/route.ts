import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

const esquemaActualizar = z.object({
  telefono: z.string().min(7, "Teléfono inválido").max(40).optional(),
  nombre: z.string().max(160).optional().nullable(),
  principal: z.boolean().optional(),
  verificado: z.boolean().optional(),
});

async function obtenerContacto(clienteId: string, contactoId: string) {
  const contacto = await prisma.cliente_contactos.findUnique({ where: { id: contactoId } });
  if (!contacto || contacto.cliente_id !== clienteId) return null;
  return contacto;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; contactoId: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const resultado = esquemaActualizar.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const existente = await obtenerContacto(params.id, params.contactoId);
    if (!existente) {
      return NextResponse.json({ success: false, error: "Contacto no encontrado" }, { status: 404 });
    }

    const { telefono, nombre, principal, verificado } = resultado.data;

    const contacto = await prisma.$transaction(async (tx) => {
      if (principal === true) {
        await tx.cliente_contactos.updateMany({
          where: { cliente_id: params.id, principal: true },
          data: { principal: false },
        });
      }

      return tx.cliente_contactos.update({
        where: { id: params.contactoId },
        data: {
          ...(telefono !== undefined ? { telefono } : {}),
          ...(nombre !== undefined ? { nombre } : {}),
          ...(principal !== undefined ? { principal } : {}),
          ...(verificado !== undefined ? { verificado } : {}),
        },
      });
    });

    return NextResponse.json({ success: true, data: contacto });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, error: "Este teléfono ya está registrado como contacto de este cliente" },
        { status: 409 }
      );
    }
    console.error("Error al actualizar contacto del cliente:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contactoId: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const existente = await obtenerContacto(params.id, params.contactoId);
    if (!existente) {
      return NextResponse.json({ success: false, error: "Contacto no encontrado" }, { status: 404 });
    }

    {
      // Protege tanto el caso explícito del enunciado (principal + único) como
      // el caso borde de dejar al cliente con cero contactos por otra vía
      // (ej. se eliminó el principal anterior sin volver a marcar uno nuevo).
      const total = await prisma.cliente_contactos.count({ where: { cliente_id: params.id } });
      if (total <= 1) {
        return NextResponse.json(
          { success: false, error: "No puedes eliminar el único contacto del cliente" },
          { status: 400 }
        );
      }
    }

    await prisma.cliente_contactos.delete({ where: { id: params.contactoId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar contacto del cliente:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
