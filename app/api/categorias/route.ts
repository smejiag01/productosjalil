import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const esquemaCategoria = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  slug: z
    .string()
    .min(1, "El slug es requerido")
    .max(50)
    .regex(/^[a-z0-9_]+$/, "El slug solo puede contener letras minúsculas, números y guiones bajos"),
  emoji: z.string().max(10).optional().nullable(),
  orden: z.number().int().min(0).optional(),
  activa: z.boolean().optional(),
});

export async function GET() {
  try {
    const categorias = await prisma.categorias.findMany({
      orderBy: { orden: "asc" },
      include: {
        _count: { select: { productos: true } },
      },
    });

    const data = categorias.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      slug: c.slug,
      emoji: c.emoji,
      orden: c.orden,
      activa: c.activa,
      num_productos: c._count.productos,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error al listar categorías:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resultado = esquemaCategoria.safeParse(body);

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

    const slugExistente = await prisma.categorias.findUnique({
      where: { slug: datos.slug },
    });
    if (slugExistente) {
      return NextResponse.json(
        { success: false, error: "Ya existe una categoría con ese slug" },
        { status: 409 }
      );
    }

    const maxOrden = await prisma.categorias.aggregate({
      _max: { orden: true },
    });

    const categoria = await prisma.categorias.create({
      data: {
        nombre: datos.nombre,
        slug: datos.slug,
        emoji: datos.emoji ?? null,
        orden: datos.orden ?? (maxOrden._max.orden ?? 0) + 1,
        activa: datos.activa ?? true,
      },
    });

    return NextResponse.json({ success: true, data: categoria }, { status: 201 });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
