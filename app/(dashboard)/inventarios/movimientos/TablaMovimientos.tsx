"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

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
  entrada: { label: "Entrada", color: "text-green-700 bg-green-50 border-green-200" },
  salida: { label: "Salida", color: "text-red-700 bg-red-50 border-red-200" },
  ajuste: { label: "Ajuste", color: "text-blue-700 bg-blue-50 border-blue-200" },
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
            <Link href="/inventarios" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              Inventarios
            </Link>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Historial de movimientos</h1>
          <p className="text-gray-500 text-sm mt-1">{total} movimientos registrados</p>
        </div>
        <a href={exportUrl} className="h-11 px-3 lg:px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex items-center gap-2 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="hidden sm:inline">Exportar</span>
        </a>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={tipoInv} onChange={(e) => setTipoInv(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">Todos los tipos</option>
            <option value="insumo">Insumos</option>
            <option value="materia_prima">Materias primas</option>
            <option value="producto_terminado">Prod. terminado</option>
          </select>
          <select value={tipoMov} onChange={(e) => setTipoMov(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">Todos los movimientos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
          </select>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} placeholder="Desde"
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none" />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} placeholder="Hasta"
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none" />
          <button onClick={aplicarFiltros}
            className="h-10 px-4 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
            Filtrar
          </button>
        </div>
      </div>

      {/* Cards móvil */}
      <div className="lg:hidden space-y-3">
        {movimientos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
            <p className="text-sm">No hay movimientos registrados</p>
          </div>
        ) : movimientos.map((m) => {
          const cfg = LABEL_MOV[m.tipoMov] ?? LABEL_MOV.ajuste;
          return (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{m.itemNombre}</p>
                  <p className="text-xs text-gray-400">{m.tipoInventario} · {m.fecha}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>{m.motivo} · {m.cantidad} {m.unidad}</span>
                <span>{m.cantidadAnterior} → {m.cantidadNueva}</span>
              </div>
              {m.notas && <p className="text-xs text-gray-400 mt-1">{m.notas}</p>}
            </div>
          );
        })}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Ítem</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Tipo inv.</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Movimiento</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Motivo</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Ant. → Nuevo</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Usuario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {movimientos.length === 0 ? (
              <tr><td colSpan={8} className="py-16 text-center text-gray-400 text-sm">No hay movimientos</td></tr>
            ) : movimientos.map((m) => {
              const cfg = LABEL_MOV[m.tipoMov] ?? LABEL_MOV.ajuste;
              return (
                <tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 text-sm text-gray-600">{m.fecha}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{m.itemNombre}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{m.tipoInventario}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>{cfg.label}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{m.motivo}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{m.cantidad} {m.unidad}</td>
                  <td className="py-3 px-4 text-sm text-gray-500 text-right">{m.cantidadAnterior} → {m.cantidadNueva}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{m.usuario}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {pagina > 1 && <Link href={buildPageUrl(pagina - 1)} className="h-10 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center">Anterior</Link>}
          <span className="text-sm text-gray-500">Página {pagina} de {totalPaginas}</span>
          {pagina < totalPaginas && <Link href={buildPageUrl(pagina + 1)} className="h-10 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center">Siguiente</Link>}
        </div>
      )}
    </div>
  );
}
