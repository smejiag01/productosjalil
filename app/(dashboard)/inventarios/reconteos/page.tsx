import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { INVENTARIO_MATERIA_PRIMA_HABILITADO } from "@/lib/inventario-flags";

import { ChevronLeft, Plus } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/clases";
export const dynamic = "force-dynamic";

const LABEL_ESTADO: Record<string, { label: string; color: string }> = {
  abierto: { label: "Abierto", color: "text-info bg-info-soft border-info/30" },
  confirmado: { label: "Confirmado", color: "text-ok bg-ok-soft border-ok/30" },
  anulado: { label: "Anulado", color: "text-ink-700 bg-ink-50 border-ink-200" },
};

export default async function ReconteosPage() {
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) notFound();

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
            <Link href="/inventarios" className="text-sm text-ink-500 hover:text-ink-700 transition-colors flex items-center gap-1">
              <ChevronLeft aria-hidden="true" className="w-4 h-4" />
              Inventarios
            </Link>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">Reconteos</h1>
          <p className="text-ink-600 text-sm mt-1">{reconteos.length} reconteos registrados</p>
        </div>
        <Link href="/inventarios/reconteos/nuevo"
          className={buttonClass({ className: "flex-shrink-0" })}>
          <Plus aria-hidden="true" className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo reconteo</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      {/* Cards móvil */}
      <div className="lg:hidden space-y-3">
        {reconteos.length === 0 ? (
          <div className="bg-white rounded-card border border-ink-200 shadow-card py-16 text-center text-ink-500">
            <p className="text-sm">No hay reconteos registrados</p>
          </div>
        ) : reconteos.map((r) => {
          const cfg = LABEL_ESTADO[r.estado] ?? LABEL_ESTADO.abierto;
          return (
            <Link key={r.id} href={`/inventarios/reconteos/${r.id}`}
              className="block bg-white rounded-card border border-ink-200 shadow-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">
                    {r.fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}
                  </p>
                  <p className="text-xs text-ink-500">{r.usuario?.nombre || "Sistema"}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
              </div>
              <p className="text-xs text-ink-600">
                {r._count.detalles > 0 ? `${r._count.detalles} ítems con diferencia` : "Sin diferencias"}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Fecha</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Usuario</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">Diferencias</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Nota general</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {reconteos.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-ink-500 text-sm">No hay reconteos registrados</td></tr>
            ) : reconteos.map((r) => {
              const cfg = LABEL_ESTADO[r.estado] ?? LABEL_ESTADO.abierto;
              return (
                <tr key={r.id} className="hover:bg-ink-50/50">
                  <td className="py-3 px-4 text-sm text-ink-700">
                    {r.fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-700">{r.usuario?.nombre || "Sistema"}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-ink-900">{r._count.detalles}</td>
                  <td className="py-3 px-4 text-sm text-ink-600 truncate max-w-xs">{r.nota_general || "—"}</td>
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
