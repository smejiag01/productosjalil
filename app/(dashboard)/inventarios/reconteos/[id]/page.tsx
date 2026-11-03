import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { INVENTARIO_MATERIA_PRIMA_HABILITADO } from "@/lib/inventario-flags";

import { ChevronLeft } from "@/components/ui/icons";
export const dynamic = "force-dynamic";

const LABEL_ESTADO: Record<string, { label: string; color: string }> = {
  abierto: { label: "Abierto", color: "text-info bg-info-soft border-info/30" },
  confirmado: { label: "Confirmado", color: "text-ok bg-ok-soft border-ok/30" },
  anulado: { label: "Anulado", color: "text-ink-700 bg-ink-50 border-ink-200" },
};

const LABEL_TIPO: Record<string, string> = {
  insumo: "Insumo",
  materia_prima: "Materia prima",
  producto_terminado: "Producto terminado",
};

export default async function DetalleReconteoPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) notFound();

  const reconteo = await prisma.inventario_reconteos.findUnique({
    where: { id: params.id },
    include: {
      usuario: { select: { id: true, nombre: true } },
      detalles: {
        include: { item: { select: { id: true, nombre: true, tipo: true, unidad: true } } },
        orderBy: { created_at: "asc" },
      },
    },
  });

  if (!reconteo) notFound();

  const cfg = LABEL_ESTADO[reconteo.estado] ?? LABEL_ESTADO.abierto;
  const detalles = reconteo.detalles.map((d) => ({
    id: d.id,
    item: d.item,
    cantidad_sistema: Number(d.cantidad_sistema),
    cantidad_fisica: Number(d.cantidad_fisica),
    diferencia: Number(d.diferencia ?? 0),
    nota: d.nota,
  }));
  const conDiferencia = detalles.filter((d) => d.diferencia !== 0);
  const sinDiferencia = detalles.filter((d) => d.diferencia === 0);

  return (
    <div>
      <div className="mb-6">
        <Link href="/inventarios/reconteos" className="text-sm text-ink-500 hover:text-ink-700 transition-colors flex items-center gap-1 mb-1">
          <ChevronLeft aria-hidden="true" className="w-4 h-4" />
          Reconteos
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">
            Reconteo del {reconteo.fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}
          </h1>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
        </div>
        <p className="text-ink-600 text-sm mt-1">
          {reconteo.usuario?.nombre || "Sistema"}
          {reconteo.confirmado_at ? ` · Confirmado ${reconteo.confirmado_at.toLocaleString("es-CO", { timeZone: "America/Bogota" })}` : ""}
        </p>
        {reconteo.nota_general && <p className="text-sm text-ink-700 mt-2">{reconteo.nota_general}</p>}
      </div>

      {conDiferencia.length > 0 && (
        <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-ink-100">
            <h3 className="font-semibold text-ink-900">Ítems con diferencia ({conDiferencia.length})</h3>
          </div>
          <div className="divide-y divide-ink-50">
            {conDiferencia.map((d) => {
              const sobrante = d.diferencia > 0;
              return (
                <div key={d.id} className="px-4 sm:px-6 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{d.item.nombre}</p>
                      <p className="text-xs text-ink-500">
                        {LABEL_TIPO[d.item.tipo] ?? d.item.tipo} · Sistema: {d.cantidad_sistema} {d.item.unidad} · Físico: {d.cantidad_fisica} {d.item.unidad}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 ${sobrante ? "text-ok" : "text-danger"}`}>
                      {sobrante ? "+" : ""}{d.diferencia.toFixed(2)} {d.item.unidad}
                    </span>
                  </div>
                  {d.nota && <p className="text-xs text-ink-600 mt-1.5">{d.nota}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sinDiferencia.length > 0 && (
        <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-ink-100">
            <h3 className="font-semibold text-ink-900">Ítems sin diferencia ({sinDiferencia.length})</h3>
          </div>
          <div className="divide-y divide-ink-50">
            {sinDiferencia.map((d) => (
              <div key={d.id} className="px-4 sm:px-6 py-2.5 flex items-center justify-between text-sm">
                <span className="text-ink-800">{d.item.nombre}</span>
                <span className="text-ink-500">{d.cantidad_fisica} {d.item.unidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
