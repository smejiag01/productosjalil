import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

const esquemaContacto = z.object({
  telefono: z.string().min(7, "Teléfono inválido").max(40),
  nombre: z.string().max(160).optional().nullable(),
  principal: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const contactos = await prisma.cliente_contactos.findMany({
      where: { cliente_id: params.id },
      orderBy: [{ principal: "desc" }, { created_at: "asc" }],
    });

    return NextResponse.json({ success: true, data: contactos });
  } catch (error) {
    console.error("Error al listar contactos del cliente:", error);
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
    const resultado = esquemaContacto.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const cliente = await prisma.clientes.findUnique({ where: { id: params.id } });
    if (!cliente) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    }

    const { telefono, nombre, principal } = resultado.data;

    const totalContactos = await prisma.cliente_contactos.count({ where: { cliente_id: params.id } });
    // El primer contacto de un cliente siempre queda como principal
    const marcarPrincipal = totalContactos === 0 || principal === true;

    const contacto = await prisma.$transaction(async (tx) => {
      if (marcarPrincipal) {
        await tx.cliente_contactos.updateMany({
          where: { cliente_id: params.id, principal: true },
          data: { principal: false },
        });
      }

      return tx.cliente_contactos.create({
        data: {
          cliente_id: params.id,
          telefono,
          nombre: nombre ?? null,
          principal: marcarPrincipal,
          // Un contacto agregado a mano por el admin ya está confirmado —
          // el flag verificado=false es para los que el bot vincula solo.
          verificado: true,
          origen: "manual",
        },
      });
    });

    return NextResponse.json({ success: true, data: contacto }, { status: 201 });
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
    console.error("Error al crear contacto del cliente:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
