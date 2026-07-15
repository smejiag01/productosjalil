import { prisma } from "@/lib/prisma";
import TablaPqrs from "./TablaPqrs";
import GraficoBarras from "@/components/GraficoBarras";

export const dynamic = "force-dynamic";

type FilaTiempo = { horas_promedio: number | null };
type FilaSemana = { semana: Date; total: number };

export default async function PqrsPage() {
  const [pqrs, tiempoRaw, tendenciaRaw] = await Promise.all([
    prisma.pqr.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.$queryRaw<FilaTiempo[]>`
      SELECT CAST(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) AS FLOAT) AS horas_promedio
      FROM pqrs WHERE estado = 'resuelto'
    `,
    prisma.$queryRaw<FilaSemana[]>`
      SELECT date_trunc('week', created_at) AS semana, CAST(COUNT(*) AS INT) AS total
      FROM pqrs WHERE created_at >= NOW() - INTERVAL '8 weeks'
      GROUP BY semana ORDER BY semana
    `,
  ]);

  const contadores: Record<string, number> = { todos: pqrs.length };
  for (const p of pqrs) {
    contadores[p.estado] = (contadores[p.estado] ?? 0) + 1;
  }

  const abiertas = (contadores.pendiente ?? 0) + (contadores.en_revision ?? 0);
  const resueltas = contadores.resuelto ?? 0;
  const horasPromedioResolucion = tiempoRaw[0]?.horas_promedio ?? null;

  const tendenciaSemanal = tendenciaRaw.map((s) => ({
    label: s.semana.toLocaleDateString("es-CO", { day: "numeric", month: "short", timeZone: "UTC" }),
    total: s.total,
  }));

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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Abiertas</p>
          <p className="text-3xl font-bold text-gray-900">{abiertas}</p>
          <p className="text-xs text-gray-400 mt-1">pendientes + en revisión</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Resueltas</p>
          <p className="text-3xl font-bold text-gray-900">{resueltas}</p>
          <p className="text-xs text-gray-400 mt-1">de {contadores.todos} en total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Tiempo promedio de resolución</p>
          <p className="text-3xl font-bold text-gray-900">
            {horasPromedioResolucion != null
              ? horasPromedioResolucion < 24
                ? `${Math.round(horasPromedioResolucion * 10) / 10} h`
                : `${Math.round((horasPromedioResolucion / 24) * 10) / 10} d`
              : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">entre reportada y resuelta</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Tendencia — últimas 8 semanas</h2>
        <GraficoBarras
          datos={tendenciaSemanal}
          claves={[{ key: "total", color: "#8B1A1A", label: "PQR's" }]}
          altura={200}
          formato="numero"
        />
      </div>

      <TablaPqrs pqrs={pqrsSerializados} contadores={contadores} />
    </div>
  );
}
