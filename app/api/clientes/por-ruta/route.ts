import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
    return NextResponse.json(
      { success: false, error: "API key inválida o faltante" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const fechaParam = searchParams.get("fecha");

    if (!fechaParam) {
      return NextResponse.json(
        { success: false, error: "Se requiere el parámetro fecha (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const fecha = new Date(fechaParam);
    const diaSemana = fecha.getDay();

    const clientes = await prisma.clientes.findMany({
      where: {
        activo: true,
        ruta: {
          activa: true,
          dias_semana: { has: diaSemana },
        },
      },
      include: {
        ruta: true,
        precios_cliente: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                unidad: true,
                precio_base: true,
                activo: true,
              },
            },
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    const resultado = clientes.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      ruta: c.ruta
        ? { id: c.ruta.id, nombre: c.ruta.nombre }
        : null,
      precios: c.precios_cliente.map((pc) => ({
        producto_id: pc.producto_id,
        producto_nombre: pc.producto.nombre,
        unidad: pc.producto.unidad,
        precio_base: Number(pc.producto.precio_base),
        precio_cliente: Number(pc.precio),
      })),
    }));

    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    console.error("Error en clientes por ruta:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
