import { prisma } from "@/lib/prisma";

export async function obtenerPedidosRango(
  desde: string,
  hasta: string,
  opciones?: { excluirCancelados?: boolean }
) {
  return prisma.pedidos.findMany({
    where: {
      fecha_pedido: {
        gte: new Date(desde + "T00:00:00.000Z"),
        lte: new Date(hasta + "T00:00:00.000Z"),
      },
      ...(opciones?.excluirCancelados ? { estado: { not: "cancelado" } } : {}),
    },
    include: {
      cliente: true,
      ruta: true,
      items: { include: { producto: true } },
    },
    orderBy: [{ ruta_id: "asc" }, { created_at: "asc" }],
  });
}

export type PedidoExportable = Awaited<ReturnType<typeof obtenerPedidosRango>>[number];
