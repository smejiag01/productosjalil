"use client";

import { useState } from "react";
import Link from "next/link";
import { formatearPrecio } from "@/lib/formato";
import { INVENTARIO_MATERIA_PRIMA_HABILITADO } from "@/lib/inventario-flags";
import BadgeStock from "./BadgeStock";
import ModalItem from "./ModalItem";
import ModalMovimiento from "./ModalMovimiento";
import ModalProduccion from "./ModalProduccion";

import { Plus, Search } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/clases";
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
  const [produccion, setProduccion] = useState<Item | null>(null);

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
          <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">{titulo}</h1>
          <p className="text-ink-600 text-sm mt-1">{items.length} ítems registrados</p>
        </div>
        <button onClick={() => { setEditando(null); setModalItem(true); }}
          className={buttonClass({ className: "flex-shrink-0" })}>
          <Plus aria-hidden="true" className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo ítem</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTROS.map((f) => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`h-10 px-3 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                filtro === f.key ? "bg-brand text-white" : "bg-white border border-ink-200 text-ink-700 hover:bg-ink-50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search aria-hidden="true" className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 border border-ink-200 rounded-control text-sm w-full sm:w-56 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        </div>
      </div>

      {/* Cards móvil/tablet */}
      <div className="lg:hidden space-y-3">
        {filtrados.length === 0 ? (
          <div className="bg-white rounded-card border border-ink-200 shadow-card py-16 text-center text-ink-500">
            <p className="text-sm">No hay ítems</p>
          </div>
        ) : filtrados.map((item) => (
          <div key={item.id} className="bg-white rounded-card border border-ink-200 shadow-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate">{item.nombre}</p>
                <p className="text-xs text-ink-500 mt-0.5">
                  {item.stock_actual} {item.unidad} · Mín: {item.stock_minimo} · {formatearPrecio(item.costo_unitario)}/{item.unidad}
                </p>
                {tipo === "insumo" && item.proveedor && <p className="text-xs text-ink-500">Prov: {item.proveedor}</p>}
                {tipo === "materia_prima" && item.tipo_animal && <p className="text-xs text-ink-500">{item.tipo_animal}{item.requiere_refrigeracion ? " · Refrigerado" : ""}</p>}
                {tipo === "producto_terminado" && item.producto && <p className="text-xs text-ink-500">Producto: {item.producto.nombre}</p>}
              </div>
              <BadgeStock actual={item.stock_actual} minimo={item.stock_minimo} />
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-ink-100 justify-end flex-wrap">
              {tipo === "producto_terminado" && (
                <>
                  {INVENTARIO_MATERIA_PRIMA_HABILITADO && (
                    <>
                      <Link href={`/inventarios/producto-terminado/${item.id}`} className="h-9 px-3 bg-ink-50 border border-ink-200 rounded-control text-xs font-medium text-ink-800 hover:bg-ink-100 flex items-center">Receta</Link>
                      <button onClick={() => setProduccion(item)} className="h-9 px-3 bg-ink-50 border border-ink-200 rounded-control text-xs font-medium text-ink-800 hover:bg-ink-100">Producción</button>
                    </>
                  )}
                  <Link href={`/inventarios/producto-terminado/${item.id}`} className="h-9 px-3 bg-ink-50 border border-ink-200 rounded-control text-xs font-medium text-ink-800 hover:bg-ink-100 flex items-center">Historial</Link>
                </>
              )}
              <button onClick={() => setMovimiento(item)} className="h-9 px-3 bg-ink-50 border border-ink-200 rounded-control text-xs font-medium text-ink-800 hover:bg-ink-100">Movimiento</button>
              <button onClick={() => { setEditando(item); setModalItem(true); }} className="h-9 px-3 bg-ink-50 border border-ink-200 rounded-control text-xs font-medium text-brand hover:bg-ink-100">Editar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Nombre</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Unidad</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">Stock</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">Mínimo</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">Costo unit.</th>
              {tipo === "insumo" && <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Proveedor</th>}
              {tipo === "materia_prima" && <>
                <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Animal</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-ink-600 uppercase">Refrig.</th>
              </>}
              {tipo === "producto_terminado" && <>
                <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Vencimiento</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Producto</th>
              </>}
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {filtrados.length === 0 ? (
              <tr><td colSpan={10} className="py-16 text-center text-ink-500 text-sm">No hay ítems</td></tr>
            ) : filtrados.map((item) => (
              <tr key={item.id} className="hover:bg-ink-50/50">
                <td className="py-3 px-4 text-sm font-medium text-ink-900">{item.nombre}</td>
                <td className="py-3 px-4 text-sm text-ink-700">{item.unidad}</td>
                <td className="py-3 px-4 text-sm text-ink-900 text-right font-medium">{item.stock_actual}</td>
                <td className="py-3 px-4 text-sm text-ink-600 text-right">{item.stock_minimo}</td>
                <td className="py-3 px-4 text-sm text-ink-700 text-right">{formatearPrecio(item.costo_unitario)}</td>
                {tipo === "insumo" && <td className="py-3 px-4 text-sm text-ink-700">{item.proveedor || "—"}</td>}
                {tipo === "materia_prima" && <>
                  <td className="py-3 px-4 text-sm text-ink-700">{item.tipo_animal || "—"}</td>
                  <td className="py-3 px-4 text-sm text-center">{item.requiere_refrigeracion ? "Sí" : "No"}</td>
                </>}
                {tipo === "producto_terminado" && <>
                  <td className="py-3 px-4 text-sm text-ink-700">{item.fecha_vencimiento ? new Date(item.fecha_vencimiento).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—"}</td>
                  <td className="py-3 px-4 text-sm text-ink-700">{item.producto?.nombre || "—"}</td>
                </>}
                <td className="py-3 px-4"><BadgeStock actual={item.stock_actual} minimo={item.stock_minimo} /></td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {tipo === "producto_terminado" && (
                      <>
                        {INVENTARIO_MATERIA_PRIMA_HABILITADO && (
                          <>
                            <Link href={`/inventarios/producto-terminado/${item.id}`} className="text-sm text-ink-700 hover:text-ink-900 font-medium">Receta</Link>
                            <button onClick={() => setProduccion(item)} className="text-sm text-ink-700 hover:text-ink-900 font-medium">Producción</button>
                          </>
                        )}
                        <Link href={`/inventarios/producto-terminado/${item.id}`} className="text-sm text-ink-700 hover:text-ink-900 font-medium">Historial</Link>
                      </>
                    )}
                    <button onClick={() => setMovimiento(item)} className="text-sm text-ink-700 hover:text-ink-900 font-medium">Movimiento</button>
                    <button onClick={() => { setEditando(item); setModalItem(true); }} className="text-sm text-brand hover:text-brand-700 font-medium">Editar</button>
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

      {produccion && (
        <ModalProduccion
          itemId={produccion.id} itemNombre={produccion.nombre}
          itemUnidad={produccion.unidad} stockActual={produccion.stock_actual}
          onCerrar={() => setProduccion(null)} />
      )}
    </div>
  );
}
