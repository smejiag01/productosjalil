import { NextRequest, NextResponse } from "next/server";
import { requireVendedor } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { toDbDate } from "@/lib/analiticas/periodos";
import { esquemaOperacion, esquemaSincronizacion, fechaBogota, type OperacionVisitas } from "@/lib/visitas";

interface Resultado {
  id: string | null;
  ok: boolean;
  /** true = error permanente (datos inválidos): la app lo descarta y no lo reintenta. */
  descartar?: boolean;
  error?: string;
}

/**
 * Recibe, en orden, lo que el vendedor registró (aunque haya sido sin señal):
 * iniciar jornada, visitas y finalizar jornada. Es idempotente: los ids los
 * genera el celular, así que reenviar la misma operación no duplica nada.
 */
export async function POST(request: NextRequest) {
  const auth = await requireVendedor();
  if (auth.error) return auth.error;
  const vendedorId = auth.session.user.id;

  const cuerpo = esquemaSincronizacion.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) {
    return NextResponse.json({ success: false, error: "Solicitud inválida" }, { status: 400 });
  }

  const resultados: Resultado[] = [];
  for (const crudo of cuerpo.data.operaciones) {
    const op = esquemaOperacion.safeParse(crudo);
    if (!op.success) {
      const id = typeof (crudo as { id?: unknown })?.id === "string" ? (crudo as { id: string }).id : null;
      resultados.push({ id, ok: false, descartar: true, error: op.error.issues[0]?.message ?? "Datos inválidos" });
      continue;
    }
    try {
      resultados.push(await aplicar(op.data, vendedorId));
    } catch (error) {
      console.error("Error al sincronizar operación de visitas:", error);
      resultados.push({ id: op.data.id, ok: false, error: "Error del servidor" });
    }
  }

  return NextResponse.json({ success: true, data: { resultados } });
}

async function aplicar(op: OperacionVisitas, vendedorId: string): Promise<Resultado> {
  if (op.tipo === "iniciar_jornada") {
    const inicio = new Date(op.inicio_at);
    await prisma.jornadas_visita.createMany({
      data: [{
        id: op.id,
        vendedor_id: vendedorId,
        fecha: toDbDate(fechaBogota(inicio)),
        ciudad: op.ciudad,
        inicio_at: inicio,
        inicio_lat: op.lat ?? null,
        inicio_lng: op.lng ?? null,
      }],
      skipDuplicates: true,
    });
    const jornada = await prisma.jornadas_visita.findUnique({ where: { id: op.id }, select: { vendedor_id: true } });
    if (jornada?.vendedor_id !== vendedorId) {
      return { id: op.id, ok: false, descartar: true, error: "Jornada inválida" };
    }
    return { id: op.id, ok: true };
  }

  if (op.tipo === "visita") {
    const jornada = await prisma.jornadas_visita.findUnique({ where: { id: op.jornada_id }, select: { vendedor_id: true } });
    if (!jornada) {
      // La jornada aún no llegó (orden alterado): se reintenta luego.
      return { id: op.id, ok: false, error: "La jornada todavía no está registrada" };
    }
    if (jornada.vendedor_id !== vendedorId) {
      return { id: op.id, ok: false, descartar: true, error: "Jornada inválida" };
    }
    await prisma.visitas.createMany({
      data: [{
        id: op.id,
        jornada_id: op.jornada_id,
        vendedor_id: vendedorId,
        registrada_at: new Date(op.registrada_at),
        nicho: op.nicho,
        nombre_empresa: op.nombre_empresa,
        direccion: op.direccion,
        telefono: op.telefono,
        contacto: op.contacto,
        observaciones: op.observaciones,
        latitud: op.lat ?? null,
        longitud: op.lng ?? null,
        precision_m: op.precision_m ?? null,
      }],
      skipDuplicates: true,
    });
    return { id: op.id, ok: true };
  }

  // finalizar_jornada
  const jornada = await prisma.jornadas_visita.findUnique({ where: { id: op.id }, select: { vendedor_id: true } });
  if (!jornada) return { id: op.id, ok: false, error: "La jornada todavía no está registrada" };
  if (jornada.vendedor_id !== vendedorId) {
    return { id: op.id, ok: false, descartar: true, error: "Jornada inválida" };
  }
  await prisma.jornadas_visita.updateMany({
    where: { id: op.id, fin_at: null },
    data: { fin_at: new Date(op.fin_at), fin_lat: op.lat ?? null, fin_lng: op.lng ?? null },
  });
  return { id: op.id, ok: true };
}
