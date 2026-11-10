import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, esApiKeyValida } from "@/lib/auth-guard";
import { normalizarWhatsapp } from "@/lib/validaciones-tienda";
import { validarHorarioMensajes } from "@/lib/mensajes-programados";

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
        whatsapp_atencion: config.whatsapp_atencion,
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

    // WhatsApp de atención al cliente (botón "Soy cliente nuevo" de la tienda):
    // se valida y se guarda normalizado (solo dígitos con prefijo 57). Vacío =
    // se oculta el botón.
    if ("whatsapp_atencion" in body) {
      const crudo = body.whatsapp_atencion;
      if (crudo === null || (typeof crudo === "string" && crudo.trim() === "")) {
        camposPermitidos.whatsapp_atencion = null;
      } else {
        const normalizado = typeof crudo === "string" ? normalizarWhatsapp(crudo) : null;
        if (!normalizado) {
          return NextResponse.json(
            {
              success: false,
              error:
                "El WhatsApp de atención debe ser un celular colombiano de 10 dígitos (ej: 316 333 2739).",
            },
            { status: 400 }
          );
        }
        camposPermitidos.whatsapp_atencion = normalizado;
      }
    }

    // Horario de mensajes automáticos: debe caer en la franja en que n8n revisa.
    if ("hora_recordatorio" in camposPermitidos || "horas_espera_followup" in camposPermitidos) {
      const horaCruda = camposPermitidos.hora_recordatorio ?? config.hora_recordatorio?.toISOString();
      const hora =
        typeof horaCruda === "string"
          ? (horaCruda.match(/(?:T|^)(d{2}:d{2})/)?.[1] ?? "")
          : "";
      const horas = Number(camposPermitidos.horas_espera_followup ?? config.horas_espera_followup);
      const horario = validarHorarioMensajes(hora, horas);
      if (!horario.ok) {
        return NextResponse.json({ success: false, error: horario.error }, { status: 400 });
      }
      camposPermitidos.hora_recordatorio = new Date(`1970-01-01T${horario.horaRecordatorio}:00.000Z`);
      camposPermitidos.horas_espera_followup = horas;
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
