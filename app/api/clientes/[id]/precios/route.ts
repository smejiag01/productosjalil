import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esquemaPrecioCliente } from "@/lib/validaciones";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const resultado = esquemaPrecioCliente.safeParse(body);

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

    const { producto_id, precio } = resultado.data;

    const cliente = await prisma.clientes.findUnique({
      where: { id: params.id },
    });
    if (!cliente) {
      return NextResponse.json(
        { success: false, error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const precioCliente = await prisma.precios_cliente.upsert({
      where: {
        cliente_id_producto_id: {
          cliente_id: params.id,
          producto_id,
        },
      },
      update: { precio },
      create: {
        cliente_id: params.id,
        producto_id,
        precio,
      },
      include: { producto: true },
    });

    return NextResponse.json({ success: true, data: precioCliente });
  } catch (error) {
    console.error("Error al guardar precio:", error);
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
  try {
    const { searchParams } = new URL(request.url);
    const producto_id = searchParams.get("producto_id");

    if (!producto_id) {
      return NextResponse.json(
        { success: false, error: "Se requiere producto_id" },
        { status: 400 }
      );
    }

    await prisma.precios_cliente.delete({
      where: {
        cliente_id_producto_id: {
          cliente_id: params.id,
          producto_id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar precio:", error);
    return NextResponse.json(
      { success: false, error: "Precio no encontrado o ya eliminado" },
      { status: 404 }
    );
  }
}
