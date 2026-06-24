import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esquemaCliente } from "@/lib/validaciones";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruta_id = searchParams.get("ruta_id");
    const activo = searchParams.get("activo");
    const busqueda = searchParams.get("q");

    const where: Record<string, unknown> = {};

    if (ruta_id) where.ruta_id = ruta_id;
    if (activo !== null && activo !== "") where.activo = activo === "true";
    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: "insensitive" } },
        { telefono: { contains: busqueda } },
        { codigo_mekano: { contains: busqueda, mode: "insensitive" } },
      ];
    }

    const clientes = await prisma.clientes.findMany({
      where,
      include: { ruta: true },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ success: true, data: clientes });
  } catch (error) {
    console.error("Error al listar clientes:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resultado = esquemaCliente.safeParse(body);

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

    const telefonoExistente = await prisma.clientes.findUnique({
      where: { telefono: datos.telefono },
    });
    if (telefonoExistente) {
      return NextResponse.json(
        { success: false, error: "Ya existe un cliente con ese teléfono" },
        { status: 409 }
      );
    }

    if (datos.codigo_mekano) {
      const codigoExistente = await prisma.clientes.findUnique({
        where: { codigo_mekano: datos.codigo_mekano },
      });
      if (codigoExistente) {
        return NextResponse.json(
          { success: false, error: "Ya existe un cliente con ese código Mekano" },
          { status: 409 }
        );
      }
    }

    const cliente = await prisma.clientes.create({
      data: {
        nombre: datos.nombre,
        telefono: datos.telefono,
        direccion: datos.direccion ?? null,
        codigo_mekano: datos.codigo_mekano ?? null,
        ruta_id: datos.ruta_id ?? null,
        activo: datos.activo ?? true,
        notas: datos.notas ?? null,
      },
      include: { ruta: true },
    });

    return NextResponse.json({ success: true, data: cliente }, { status: 201 });
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
