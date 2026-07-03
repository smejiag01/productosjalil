import { prisma } from "@/lib/prisma";
import TablaPqrs from "./TablaPqrs";

export const dynamic = "force-dynamic";

export default async function PqrsPage() {
  const pqrs = await prisma.pqr.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const contadores: Record<string, number> = { todos: pqrs.length };
  for (const p of pqrs) {
    contadores[p.estado] = (contadores[p.estado] ?? 0) + 1;
  }

  const pqrsSerializados = pqrs.map((p) => ({
    id: p.id,
    clienteNombre: p.clienteNombre ?? "Sin nombre",
    telefono: p.telefono,
    texto: p.texto,
    estado: p.estado,
    fecha: p.createdAt.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "America/Bogota",
    }),
    hora: p.createdAt.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Bogota",
    }),
    numAdjuntos: Array.isArray(p.adjuntos) ? p.adjuntos.length : 0,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">PQR&apos;s</h1>
        <p className="text-gray-500 text-sm mt-1">Peticiones, quejas y reclamos recibidos por WhatsApp</p>
      </div>

      <TablaPqrs pqrs={pqrsSerializados} contadores={contadores} />
    </div>
  );
}
