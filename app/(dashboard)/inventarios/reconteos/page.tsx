import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LABEL_ESTADO: Record<string, { label: string; color: string }> = {
  abierto: { label: "Abierto", color: "text-blue-700 bg-blue-50 border-blue-200" },
  confirmado: { label: "Confirmado", color: "text-green-700 bg-green-50 border-green-200" },
  anulado: { label: "Anulado", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

export default async function ReconteosPage() {
  const reconteos = await prisma.inventario_reconteos.findMany({
    include: {
      usuario: { select: { id: true, nombre: true } },
      _count: { select: { detalles: { where: { NOT: { diferencia: 0 } } } } },
    },
    orderBy: { fecha: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/inventarios" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              Inventarios
            </Link>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Reconteos</h1>
          <p className="text-gray-500 text-sm mt-1">{reconteos.length} reconteos registrados</p>
        </div>
        <Link href="/inventarios/reconteos/nuevo"
          className="h-11 px-3 lg:px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex items-center gap-2 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Nuevo reconteo</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      {/* Cards móvil */}
      <div className="lg:hidden space-y-3">
        {reconteos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
            <p className="text-sm">No hay reconteos registrados</p>
          </div>
        ) : reconteos.map((r) => {
          const cfg = LABEL_ESTADO[r.estado] ?? LABEL_ESTADO.abierto;
          return (
            <Link key={r.id} href={`/inventarios/reconteos/${r.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {r.fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}
                  </p>
                  <p className="text-xs text-gray-400">{r.usuario?.nombre || "Sistema"}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
              </div>
              <p className="text-xs text-gray-500">
                {r._count.detalles > 0 ? `${r._count.detalles} ítems con diferencia` : "Sin diferencias"}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Diferencias</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Nota general</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reconteos.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-gray-400 text-sm">No hay reconteos registrados</td></tr>
            ) : reconteos.map((r) => {
              const cfg = LABEL_ESTADO[r.estado] ?? LABEL_ESTADO.abierto;
              return (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {r.fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{r.usuario?.nombre || "Sistema"}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">{r._count.detalles}</td>
                  <td className="py-3 px-4 text-sm text-gray-500 truncate max-w-xs">{r.nota_general || "—"}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/inventarios/reconteos/${r.id}`} className="text-sm text-brand hover:text-brand-light font-medium">Ver detalle</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
