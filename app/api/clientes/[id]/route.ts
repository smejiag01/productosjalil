import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esquemaCliente } from "@/lib/validaciones";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const cliente = await prisma.clientes.findUnique({
      where: { id: params.id },
      include: {
        ruta: true,
        precios_cliente: {
          include: { producto: true },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: cliente });
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const resultado = esquemaCliente.partial().safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({
        campo: i.path.join("."),
        mensaje: i.message,
      }));
      return NextResponse.json(
        { success: false, error: "Datos inválidos", errores },
        { status: 400 }
      );
    }

    const datos = resultado.data;

    const clienteExistente = await prisma.clientes.findUnique({
      where: { id: params.id },
    });
    if (!clienteExistente) {
      return NextResponse.json(
        { success: false, error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    if (datos.telefono && datos.telefono !== clienteExistente.telefono) {
      const telefonoDuplicado = await prisma.clientes.findUnique({
        where: { telefono: datos.telefono },
      });
      if (telefonoDuplicado) {
        return NextResponse.json(
          { success: false, error: "Ya existe un cliente con ese teléfono" },
          { status: 409 }
        );
      }
    }

    if (
      datos.codigo_mekano &&
      datos.codigo_mekano !== clienteExistente.codigo_mekano
    ) {
      const codigoDuplicado = await prisma.clientes.findUnique({
        where: { codigo_mekano: datos.codigo_mekano },
      });
      if (codigoDuplicado) {
        return NextResponse.json(
          { success: false, error: "Ya existe un cliente con ese código Mekano" },
          { status: 409 }
        );
      }
    }

    const cliente = await prisma.clientes.update({
      where: { id: params.id },
      data: datos,
      include: { ruta: true },
    });

    return NextResponse.json({ success: true, data: cliente });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const cliente = await prisma.clientes.findUnique({
      where: { id: params.id },
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const permanente = request.nextUrl.searchParams.get("permanente") === "true";

    if (!permanente) {
      const clienteDesactivado = await prisma.clientes.update({
        where: { id: params.id },
        data: { activo: false },
      });
      return NextResponse.json({ success: true, data: clienteDesactivado });
    }

    const [numPedidos, numPqrs] = await Promise.all([
      prisma.pedidos.count({ where: { cliente_id: params.id } }),
      prisma.pqr.count({ where: { clienteId: params.id } }),
    ]);

    if (numPedidos > 0 || numPqrs > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se puede eliminar de forma permanente: el cliente tiene pedidos o PQRs registrados. Archívalo en su lugar.",
        },
        { status: 409 }
      );
    }

    await prisma.clientes.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
