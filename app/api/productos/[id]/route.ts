import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esquemaProducto } from "@/lib/validaciones-producto";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const resultado = esquemaProducto.partial().safeParse(body);

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

    const existente = await prisma.productos.findUnique({
      where: { id: params.id },
    });
    if (!existente) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const producto = await prisma.productos.update({
      where: { id: params.id },
      data: resultado.data,
    });

    return NextResponse.json({ success: true, data: producto });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existente = await prisma.productos.findUnique({
      where: { id: params.id },
    });
    if (!existente) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const producto = await prisma.productos.update({
      where: { id: params.id },
      data: { activo: false },
    });

    return NextResponse.json({ success: true, data: producto });
  } catch (error) {
    console.error("Error al desactivar producto:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
