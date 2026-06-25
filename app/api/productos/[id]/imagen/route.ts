import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const producto = await prisma.productos.findUnique({
      where: { id: params.id },
    });
    if (!producto) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const archivo = formData.get("imagen") as File | null;

    if (!archivo) {
      return NextResponse.json(
        { success: false, error: "No se envió ninguna imagen" },
        { status: 400 }
      );
    }

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];
    if (!tiposPermitidos.includes(archivo.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Formato no soportado. Usa JPG, PNG o WebP",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await archivo.arrayBuffer());

    const imagenOptimizada = await sharp(buffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const nombreArchivo = `productos/${params.id}-${Date.now()}.webp`;

    const blob = await put(nombreArchivo, imagenOptimizada, {
      access: "public",
      contentType: "image/webp",
    });

    await prisma.productos.update({
      where: { id: params.id },
      data: { imagen_url: blob.url },
    });

    return NextResponse.json({
      success: true,
      data: { imagen_url: blob.url },
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la imagen" },
      { status: 500 }
    );
  }
}
