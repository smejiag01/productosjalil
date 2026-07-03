import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LABEL_ESTADO: Record<string, { label: string; color: string }> = {
  abierto: { label: "Abierto", color: "text-blue-700 bg-blue-50 border-blue-200" },
  confirmado: { label: "Confirmado", color: "text-green-700 bg-green-50 border-green-200" },
  anulado: { label: "Anulado", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

const LABEL_TIPO: Record<string, string> = {
  insumo: "Insumo",
  materia_prima: "Materia prima",
  producto_terminado: "Producto terminado",
};

export default async function DetalleReconteoPage({ params }: { params: { id: string } }) {
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
        <Link href="/inventarios/reconteos" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Reconteos
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Reconteo del {reconteo.fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}
          </h1>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          {reconteo.usuario?.nombre || "Sistema"}
          {reconteo.confirmado_at ? ` · Confirmado ${reconteo.confirmado_at.toLocaleString("es-CO", { timeZone: "America/Bogota" })}` : ""}
        </p>
        {reconteo.nota_general && <p className="text-sm text-gray-600 mt-2">{reconteo.nota_general}</p>}
      </div>

      {conDiferencia.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Ítems con diferencia ({conDiferencia.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {conDiferencia.map((d) => {
              const sobrante = d.diferencia > 0;
              return (
                <div key={d.id} className="px-4 sm:px-6 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.item.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {LABEL_TIPO[d.item.tipo] ?? d.item.tipo} · Sistema: {d.cantidad_sistema} {d.item.unidad} · Físico: {d.cantidad_fisica} {d.item.unidad}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 ${sobrante ? "text-green-600" : "text-red-600"}`}>
                      {sobrante ? "+" : ""}{d.diferencia.toFixed(2)} {d.item.unidad}
                    </span>
                  </div>
                  {d.nota && <p className="text-xs text-gray-500 mt-1.5">{d.nota}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sinDiferencia.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Ítems sin diferencia ({sinDiferencia.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {sinDiferencia.map((d) => (
              <div key={d.id} className="px-4 sm:px-6 py-2.5 flex items-center justify-between text-sm">
                <span className="text-gray-700">{d.item.nombre}</span>
                <span className="text-gray-400">{d.cantidad_fisica} {d.item.unidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
