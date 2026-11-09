import { prisma } from "@/lib/prisma";
import { toDbDate } from "@/lib/analiticas/periodos";

export interface FiltroVisitas {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
  vendedorId?: string | null;
}

/** Jornadas de visitas (con sus visitas y el vendedor) en un rango de días. */
export async function obtenerJornadas({ desde, hasta, vendedorId }: FiltroVisitas) {
  return prisma.jornadas_visita.findMany({
    where: {
      fecha: { gte: toDbDate(desde), lte: toDbDate(hasta) },
      ...(vendedorId ? { vendedor_id: vendedorId } : {}),
    },
    orderBy: [{ fecha: "desc" }, { inicio_at: "desc" }],
    include: {
      vendedor: { select: { id: true, nombre: true } },
      visitas: {
        orderBy: { registrada_at: "asc" },
        include: { cliente: { select: { id: true, nombre: true } } },
      },
    },
  });
}

export type JornadaConVisitas = Awaited<ReturnType<typeof obtenerJornadas>>[number];
