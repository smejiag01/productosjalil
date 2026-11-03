"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { ChevronLeft, Download } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/clases";
interface Movimiento {
  id: string;
  fecha: string;
  itemNombre: string;
  tipoInventario: string;
  tipoMov: string;
  motivo: string;
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;
  unidad: string;
  notas: string | null;
  usuario: string;
}

interface Props {
  movimientos: Movimiento[];
  pagina: number;
  totalPaginas: number;
  total: number;
  filtros: { tipo_inventario?: string; tipo_movimiento?: string; desde?: string; hasta?: string };
  exportUrl: string;
}

const LABEL_MOV: Record<string, { label: string; color: string }> = {
  entrada: { label: "Entrada", color: "text-ok bg-ok-soft border-ok/30" },
  salida: { label: "Salida", color: "text-danger bg-danger-soft border-danger/30" },
  ajuste: { label: "Ajuste", color: "text-info bg-info-soft border-info/30" },
};

export default function TablaMovimientos({ movimientos, pagina, totalPaginas, total, filtros, exportUrl }: Props) {
  const router = useRouter();
  const [tipoInv, setTipoInv] = useState(filtros.tipo_inventario || "");
  const [tipoMov, setTipoMov] = useState(filtros.tipo_movimiento || "");
  const [desde, setDesde] = useState(filtros.desde || "");
  const [hasta, setHasta] = useState(filtros.hasta || "");

  function aplicarFiltros() {
    const params = new URLSearchParams();
    if (tipoInv) params.set("tipo_inventario", tipoInv);
    if (tipoMov) params.set("tipo_movimiento", tipoMov);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    router.push(`/inventarios/movimientos?${params.toString()}`);
  }

  function buildPageUrl(pag: number) {
    const params = new URLSearchParams();
    if (filtros.tipo_inventario) params.set("tipo_inventario", filtros.tipo_inventario);
    if (filtros.tipo_movimiento) params.set("tipo_movimiento", filtros.tipo_movimiento);
    if (filtros.desde) params.set("desde", filtros.desde);
    if (filtros.hasta) params.set("hasta", filtros.hasta);
    params.set("pagina", pag.toString());
    return `/inventarios/movimientos?${params.toString()}`;
  }

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
          <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">Historial de movimientos</h1>
          <p className="text-ink-600 text-sm mt-1">{total} movimientos registrados</p>
        </div>
        <a href={exportUrl} className={buttonClass({ className: "flex-shrink-0" })}>
          <Download aria-hidden="true" className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </a>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-card border border-ink-200 shadow-card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={tipoInv} onChange={(e) => setTipoInv(e.target.value)}
            className="h-10 px-3 border border-ink-200 rounded-control text-sm outline-none">
            <option value="">Todos los tipos</option>
            <option value="insumo">Insumos</option>
            <option value="materia_prima">Materias primas</option>
            <option value="producto_terminado">Prod. terminado</option>
          </select>
          <select value={tipoMov} onChange={(e) => setTipoMov(e.target.value)}
            className="h-10 px-3 border border-ink-200 rounded-control text-sm outline-none">
            <option value="">Todos los movimientos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
          </select>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} placeholder="Desde"
            className="h-10 px-3 border border-ink-200 rounded-control text-sm outline-none" />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} placeholder="Hasta"
            className="h-10 px-3 border border-ink-200 rounded-control text-sm outline-none" />
          <button onClick={aplicarFiltros}
            className="h-10 px-4 bg-ink-100 rounded-control text-sm font-medium text-ink-800 hover:bg-ink-200 transition-colors">
            Filtrar
          </button>
        </div>
      </div>

      {/* Cards móvil */}
      <div className="lg:hidden space-y-3">
        {movimientos.length === 0 ? (
          <div className="bg-white rounded-card border border-ink-200 shadow-card py-16 text-center text-ink-500">
            <p className="text-sm">No hay movimientos registrados</p>
          </div>
        ) : movimientos.map((m) => {
          const cfg = LABEL_MOV[m.tipoMov] ?? LABEL_MOV.ajuste;
          return (
            <div key={m.id} className="bg-white rounded-card border border-ink-200 shadow-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{m.itemNombre}</p>
                  <p className="text-xs text-ink-500">{m.tipoInventario} · {m.fecha}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-ink-600 pt-2 border-t border-ink-100">
                <span>{m.motivo} · {m.cantidad} {m.unidad}</span>
                <span>{m.cantidadAnterior} → {m.cantidadNueva}</span>
              </div>
              {m.notas && <p className="text-xs text-ink-500 mt-1">{m.notas}</p>}
            </div>
          );
        })}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Fecha</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Ítem</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Tipo inv.</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Movimiento</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Motivo</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">Cantidad</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">Ant. → Nuevo</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Usuario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {movimientos.length === 0 ? (
              <tr><td colSpan={8} className="py-16 text-center text-ink-500 text-sm">No hay movimientos</td></tr>
            ) : movimientos.map((m) => {
              const cfg = LABEL_MOV[m.tipoMov] ?? LABEL_MOV.ajuste;
              return (
                <tr key={m.id} className="hover:bg-ink-50/50">
                  <td className="py-3 px-4 text-sm text-ink-700">{m.fecha}</td>
                  <td className="py-3 px-4 text-sm font-medium text-ink-900">{m.itemNombre}</td>
                  <td className="py-3 px-4 text-sm text-ink-700">{m.tipoInventario}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-700">{m.motivo}</td>
                  <td className="py-3 px-4 text-sm text-ink-900 text-right">{m.cantidad} {m.unidad}</td>
                  <td className="py-3 px-4 text-sm text-ink-600 text-right">{m.cantidadAnterior} → {m.cantidadNueva}</td>
                  <td className="py-3 px-4 text-sm text-ink-700">{m.usuario}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {pagina > 1 && <Link href={buildPageUrl(pagina - 1)} className="h-10 px-4 bg-white border border-ink-200 rounded-control text-sm text-ink-700 hover:bg-ink-50 flex items-center">Anterior</Link>}
          <span className="text-sm text-ink-600">Página {pagina} de {totalPaginas}</span>
          {pagina < totalPaginas && <Link href={buildPageUrl(pagina + 1)} className="h-10 px-4 bg-white border border-ink-200 rounded-control text-sm text-ink-700 hover:bg-ink-50 flex items-center">Siguiente</Link>}
        </div>
      )}
    </div>
  );
}
