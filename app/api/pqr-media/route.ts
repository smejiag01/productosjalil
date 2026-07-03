import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";

const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10MB

const TIPOS_IMAGEN = ["image/jpeg", "image/jpg", "image/png"];
const TIPOS_DOCUMENTO = ["application/pdf"];
const TIPOS_PERMITIDOS = [...TIPOS_IMAGEN, ...TIPOS_DOCUMENTO];

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.N8N_UPLOAD_SECRET) {
    return NextResponse.json(
      { success: false, error: "Token inválido o faltante" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const archivo = formData.get("file") as File | null;

    if (!archivo) {
      return NextResponse.json(
        { success: false, error: "No se envió ningún archivo (campo 'file')" },
        { status: 400 }
      );
    }

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      return NextResponse.json(
        { success: false, error: "Formato no soportado. Usa JPG, PNG o PDF" },
        { status: 400 }
      );
    }

    if (archivo.size > TAMANO_MAXIMO) {
      return NextResponse.json(
        { success: false, error: "El archivo supera el tamaño máximo permitido (10MB)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const esImagen = TIPOS_IMAGEN.includes(archivo.type);

    let contenido: Buffer;
    let contentType: string;
    let extension: string;

    if (esImagen) {
      // JPEG para compatibilidad con WhatsApp Business API (no soporta WebP en mensajes de imagen)
      contenido = await sharp(buffer)
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      contentType = "image/jpeg";
      extension = "jpg";
    } else {
      contenido = buffer;
      contentType = archivo.type;
      extension = EXTENSIONES[archivo.type] ?? "bin";
    }

    const nombreArchivo = `pqrs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const blob = await put(nombreArchivo, contenido, {
      access: "public",
      contentType,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Error al subir evidencia de PQR:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar el archivo" },
      { status: 500 }
    );
  }
}
