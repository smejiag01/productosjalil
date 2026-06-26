import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const esquemaCategoriaParcial = z.object({
  nombre: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .max(50)
    .regex(/^[a-z0-9_]+$/, "El slug solo puede contener letras minúsculas, números y guiones bajos")
    .optional(),
  emoji: z.string().max(10).optional().nullable(),
  orden: z.number().int().min(0).optional(),
  activa: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoria = await prisma.categorias.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { productos: true } },
      },
    });

    if (!categoria) {
      return NextResponse.json(
        { success: false, error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...categoria,
        num_productos: categoria._count.productos,
      },
    });
  } catch (error) {
    console.error("Error al obtener categoría:", error);
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
  try {
    const body = await request.json();
    const resultado = esquemaCategoriaParcial.safeParse(body);

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

    const existente = await prisma.categorias.findUnique({
      where: { id: params.id },
    });
    if (!existente) {
      return NextResponse.json(
        { success: false, error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    const datos = resultado.data;

    if (datos.slug && datos.slug !== existente.slug) {
      const slugDuplicado = await prisma.categorias.findUnique({
        where: { slug: datos.slug },
      });
      if (slugDuplicado) {
        return NextResponse.json(
          { success: false, error: "Ya existe una categoría con ese slug" },
          { status: 409 }
        );
      }
    }

    const categoria = await prisma.categorias.update({
      where: { id: params.id },
      data: datos,
    });

    return NextResponse.json({ success: true, data: categoria });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
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
    const categoria = await prisma.categorias.findUnique({
      where: { id: params.id },
      include: { _count: { select: { productos: true } } },
    });

    if (!categoria) {
      return NextResponse.json(
        { success: false, error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    if (categoria._count.productos > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede eliminar la categoría "${categoria.nombre}" porque tiene ${categoria._count.productos} producto(s) asociado(s). Reasígnalos primero.`,
        },
        { status: 409 }
      );
    }

    await prisma.categorias.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
