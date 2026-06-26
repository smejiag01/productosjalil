import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esquemaProducto } from "@/lib/validaciones-producto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("cliente_id");
    const soloActivos = searchParams.get("activo") !== "false";

    if (clienteId) {
      const productos = await prisma.productos.findMany({
        where: soloActivos ? { activo: true } : undefined,
        orderBy: { orden: "asc" },
        include: {
          precios_cliente: {
            where: { cliente_id: clienteId },
            select: { precio: true },
          },
        },
      });

      const data = productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        imagen_url: p.imagen_url,
        unidad: p.unidad,
        precio_base: Number(p.precio_base),
        activo: p.activo,
        orden: p.orden,
        precio_cliente:
          p.precios_cliente.length > 0
            ? Number(p.precios_cliente[0].precio)
            : null,
      }));

      return NextResponse.json({ success: true, data });
    }

    const productos = await prisma.productos.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: { orden: "asc" },
    });

    const data = productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      imagen_url: p.imagen_url,
      unidad: p.unidad,
      precio_base: Number(p.precio_base),
      activo: p.activo,
      orden: p.orden,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error al listar productos:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resultado = esquemaProducto.safeParse(body);

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

    const maxOrden = await prisma.productos.aggregate({
      _max: { orden: true },
    });

    const producto = await prisma.productos.create({
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion ?? null,
        unidad: datos.unidad,
        precio_base: datos.precio_base,
        activo: datos.activo ?? true,
        orden: datos.orden ?? (maxOrden._max.orden ?? 0) + 1,
        categoria_id: datos.categoria_id ?? null,
      },
    });

    return NextResponse.json(
      { success: true, data: producto },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
