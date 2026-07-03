"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import SelectorBusqueda from "@/components/SelectorBusqueda";

interface Insumo {
  id: string;
  nombre: string;
  unidad: string;
  tipo: string;
  stock_actual?: number;
}

interface LineaReceta {
  id: string;
  cantidad_requerida: number;
  insumo: Insumo;
}

interface Props {
  productoTerminadoId: string;
  recetaInicial: LineaReceta[];
  disponibles: Insumo[];
}

const LABEL_TIPO: Record<string, string> = {
  insumo: "Insumo",
  materia_prima: "Materia prima",
};

export default function SeccionReceta({ productoTerminadoId, recetaInicial, disponibles }: Props) {
  const router = useRouter();
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(null);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [cantidadNueva, setCantidadNueva] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [cantidadEditada, setCantidadEditada] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const idsEnReceta = useMemo(() => new Set(recetaInicial.map((r) => r.insumo.id)), [recetaInicial]);

  const opcionesDisponibles = useMemo(
    () =>
      disponibles
        .filter((i) => !idsEnReceta.has(i.id))
        .map((i) => ({
          id: i.id,
          titulo: i.nombre,
          subtitulo: `${LABEL_TIPO[i.tipo] ?? i.tipo} · ${i.unidad}${
            i.stock_actual !== undefined ? ` · Stock: ${i.stock_actual}` : ""
          }`,
        })),
    [disponibles, idsEnReceta]
  );

  function seleccionarInsumo(id: string) {
    const i = disponibles.find((x) => x.id === id);
    if (!i) return;
    setInsumoSeleccionado(i);
    setMostrarSelector(false);
  }

  async function agregarLinea() {
    setError("");
    const cant = parseFloat(cantidadNueva);
    if (!insumoSeleccionado) {
      setError("Selecciona un insumo primero");
      return;
    }
    if (isNaN(cant) || cant <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }
    setCargando(true);
    try {
      const res = await fetch("/api/inventarios/recetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_terminado_id: productoTerminadoId,
          insumo_id: insumoSeleccionado.id,
          cantidad_requerida: cant,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al agregar el insumo");
        setCargando(false);
        return;
      }
      setInsumoSeleccionado(null);
      setCantidadNueva("");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  async function guardarEdicion(id: string) {
    setError("");
    const cant = parseFloat(cantidadEditada);
    if (isNaN(cant) || cant <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }
    setCargando(true);
    try {
      const res = await fetch(`/api/inventarios/recetas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad_requerida: cant }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al actualizar");
        setCargando(false);
        return;
      }
      setEditandoId(null);
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  async function quitarLinea(id: string) {
    if (!confirm("¿Quitar este insumo de la receta?")) return;
    setCargando(true);
    try {
      const res = await fetch(`/api/inventarios/recetas/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al quitar el insumo");
        setCargando(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Receta (BOM)</h3>
        <p className="text-xs text-gray-400 mt-0.5">Insumos requeridos por cada unidad producida</p>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {recetaInicial.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">Sin insumos asignados aún</div>
        ) : (
          recetaInicial.map((linea) => (
            <div key={linea.id} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{linea.insumo.nombre}</p>
                <p className="text-xs text-gray-400">{LABEL_TIPO[linea.insumo.tipo] ?? linea.insumo.tipo}</p>
              </div>

              {editandoId === linea.id ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    autoFocus
                    value={cantidadEditada}
                    onChange={(e) => setCantidadEditada(e.target.value)}
                    min="0"
                    step="0.0001"
                    className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                  <span className="text-xs text-gray-400">{linea.insumo.unidad}</span>
                  <button
                    onClick={() => guardarEdicion(linea.id)}
                    disabled={cargando}
                    className="text-xs font-medium text-brand hover:text-brand-light disabled:opacity-50"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="text-xs font-medium text-gray-400 hover:text-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm text-gray-700 font-medium">
                    {linea.cantidad_requerida} {linea.insumo.unidad}
                  </span>
                  <button
                    onClick={() => {
                      setEditandoId(linea.id);
                      setCantidadEditada(String(linea.cantidad_requerida));
                    }}
                    className="text-xs font-medium text-brand hover:text-brand-light"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => quitarLinea(linea.id)}
                    disabled={cargando}
                    className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Agregar insumo */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Agregar insumo</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => setMostrarSelector(true)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-left bg-white outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <span className={insumoSeleccionado ? "text-gray-900" : "text-gray-400"}>
              {insumoSeleccionado ? insumoSeleccionado.nombre : "Buscar insumo o materia prima..."}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <input
            type="number"
            placeholder={insumoSeleccionado ? `Cantidad (${insumoSeleccionado.unidad})` : "Cantidad"}
            value={cantidadNueva}
            onChange={(e) => setCantidadNueva(e.target.value)}
            min="0"
            step="0.0001"
            className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <button
            onClick={agregarLinea}
            disabled={cargando || !insumoSeleccionado}
            className="h-10 px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex-shrink-0"
          >
            Agregar
          </button>
        </div>
      </div>

      {mostrarSelector && (
        <SelectorBusqueda
          titulo="Seleccionar insumo o materia prima"
          placeholder="Buscar..."
          opciones={opcionesDisponibles}
          onSeleccionar={seleccionarInsumo}
          onCerrar={() => setMostrarSelector(false)}
        />
      )}
    </div>
  );
}
