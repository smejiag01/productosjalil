import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, esApiKeyValida } from "@/lib/auth-guard";

// n8n consume la configuración (horarios/mensajes de recordatorio) sin sesión
// de dashboard; si no trae la API key válida, exigimos sesión de admin.
export async function GET(request: NextRequest) {
  if (!esApiKeyValida(request, "API_SECRET_KEY")) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
  }

  try {
    const config = await prisma.configuracion.findFirst();

    if (!config) {
      return NextResponse.json(
        { success: false, error: "No hay registro de configuración" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        nombre_negocio: config.nombre_negocio,
        nit: config.nit,
        direccion: config.direccion,
        telefono: config.telefono,
        hora_recordatorio: config.hora_recordatorio,
        horas_espera_followup: config.horas_espera_followup,
        mensaje_recordatorio: config.mensaje_recordatorio,
        mensaje_followup: config.mensaje_followup,
      },
    });
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    const config = await prisma.configuracion.findFirst();
    if (!config) {
      return NextResponse.json(
        { success: false, error: "No hay registro de configuración" },
        { status: 404 }
      );
    }

    const camposPermitidos: Record<string, unknown> = {};
    const campos = [
      "nombre_negocio",
      "nit",
      "direccion",
      "telefono",
      "hora_recordatorio",
      "horas_espera_followup",
      "mensaje_recordatorio",
      "mensaje_followup",
    ];

    for (const campo of campos) {
      if (campo in body) {
        camposPermitidos[campo] = body[campo];
      }
    }

    if (Object.keys(camposPermitidos).length === 0) {
      return NextResponse.json(
        { success: false, error: "No se enviaron campos para actualizar" },
        { status: 400 }
      );
    }

    const actualizado = await prisma.configuracion.update({
      where: { id: config.id },
      data: camposPermitidos,
    });

    return NextResponse.json({ success: true, data: actualizado });
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
