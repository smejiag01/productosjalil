"use client";

import { useState } from "react";
import { formatearPrecio } from "@/lib/formato";
import BadgeStock from "./BadgeStock";
import ModalItem from "./ModalItem";
import ModalMovimiento from "./ModalMovimiento";

interface Item {
  id: string;
  nombre: string;
  tipo: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor?: string | null;
  tipo_animal?: string | null;
  requiere_refrigeracion?: boolean;
  fecha_vencimiento?: string | null;
  producto?: { id: string; nombre: string } | null;
  activo: boolean;
}

interface Props {
  items: Item[];
  tipo: "insumo" | "materia_prima" | "producto_terminado";
  titulo: string;
}

const FILTROS = [
  { key: "todos", label: "Todos" },
  { key: "alerta", label: "Con alerta" },
  { key: "ok", label: "Sin alerta" },
];

export default function TablaInventario({ items, tipo, titulo }: Props) {
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [modalItem, setModalItem] = useState(false);
  const [editando, setEditando] = useState<Item | null>(null);
  const [movimiento, setMovimiento] = useState<Item | null>(null);

  const filtrados = items.filter((i) => {
    if (filtro === "alerta" && i.stock_actual > i.stock_minimo) return false;
    if (filtro === "ok" && i.stock_actual <= i.stock_minimo) return false;
    if (busqueda && !i.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{titulo}</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} ítems registrados</p>
        </div>
        <button onClick={() => { setEditando(null); setModalItem(true); }}
          className="h-11 px-3 lg:px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex items-center gap-2 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Nuevo ítem</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTROS.map((f) => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`h-10 px-3 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                filtro === f.key ? "bg-brand text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-56 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        </div>
      </div>

      {/* Cards móvil/tablet */}
      <div className="lg:hidden space-y-3">
        {filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
            <p className="text-sm">No hay ítems</p>
          </div>
        ) : filtrados.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.nombre}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.stock_actual} {item.unidad} · Mín: {item.stock_minimo} · {formatearPrecio(item.costo_unitario)}/{item.unidad}
                </p>
                {tipo === "insumo" && item.proveedor && <p className="text-xs text-gray-400">Prov: {item.proveedor}</p>}
                {tipo === "materia_prima" && item.tipo_animal && <p className="text-xs text-gray-400">{item.tipo_animal}{item.requiere_refrigeracion ? " · Refrigerado" : ""}</p>}
                {tipo === "producto_terminado" && item.producto && <p className="text-xs text-gray-400">Producto: {item.producto.nombre}</p>}
              </div>
              <BadgeStock actual={item.stock_actual} minimo={item.stock_minimo} />
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100 justify-end">
              <button onClick={() => setMovimiento(item)} className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100">Movimiento</button>
              <button onClick={() => { setEditando(item); setModalItem(true); }} className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-brand hover:bg-gray-100">Editar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Unidad</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Mínimo</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Costo unit.</th>
              {tipo === "insumo" && <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Proveedor</th>}
              {tipo === "materia_prima" && <>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Animal</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Refrig.</th>
              </>}
              {tipo === "producto_terminado" && <>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Producto</th>
              </>}
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.length === 0 ? (
              <tr><td colSpan={10} className="py-16 text-center text-gray-400 text-sm">No hay ítems</td></tr>
            ) : filtrados.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.nombre}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{item.unidad}</td>
                <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">{item.stock_actual}</td>
                <td className="py-3 px-4 text-sm text-gray-500 text-right">{item.stock_minimo}</td>
                <td className="py-3 px-4 text-sm text-gray-600 text-right">{formatearPrecio(item.costo_unitario)}</td>
                {tipo === "insumo" && <td className="py-3 px-4 text-sm text-gray-600">{item.proveedor || "—"}</td>}
                {tipo === "materia_prima" && <>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.tipo_animal || "—"}</td>
                  <td className="py-3 px-4 text-sm text-center">{item.requiere_refrigeracion ? "Sí" : "No"}</td>
                </>}
                {tipo === "producto_terminado" && <>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.fecha_vencimiento ? new Date(item.fecha_vencimiento).toLocaleDateString("es-CO") : "—"}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.producto?.nombre || "—"}</td>
                </>}
                <td className="py-3 px-4"><BadgeStock actual={item.stock_actual} minimo={item.stock_minimo} /></td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setMovimiento(item)} className="text-sm text-gray-600 hover:text-gray-900 font-medium">Movimiento</button>
                    <button onClick={() => { setEditando(item); setModalItem(true); }} className="text-sm text-brand hover:text-brand-light font-medium">Editar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalItem && (
        <ModalItem tipo={tipo}
          itemInicial={editando ? {
            id: editando.id, nombre: editando.nombre, unidad: editando.unidad,
            stock_minimo: editando.stock_minimo, costo_unitario: editando.costo_unitario,
            proveedor: editando.proveedor, tipo_animal: editando.tipo_animal,
            requiere_refrigeracion: editando.requiere_refrigeracion,
            fecha_vencimiento: editando.fecha_vencimiento, producto_id: editando.producto?.id,
            activo: editando.activo,
          } : null}
          onCerrar={() => { setModalItem(false); setEditando(null); }} />
      )}

      {movimiento && (
        <ModalMovimiento
          itemId={movimiento.id} itemNombre={movimiento.nombre}
          itemUnidad={movimiento.unidad} stockActual={movimiento.stock_actual}
          onCerrar={() => setMovimiento(null)} />
      )}
    </div>
  );
}
