"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface LineaReceta {
  id: string;
  cantidad_requerida: number;
  insumo: { id: string; nombre: string; unidad: string; stock_actual: number };
}

interface Negativo {
  id: string;
  nombre: string;
  unidad: string;
  stock_resultante: number;
}

interface Props {
  itemId: string;
  itemNombre: string;
  itemUnidad: string;
  stockActual: number;
  onCerrar: () => void;
}

export default function ModalProduccion({ itemId, itemNombre, itemUnidad, stockActual, onCerrar }: Props) {
  const router = useRouter();
  const [receta, setReceta] = useState<LineaReceta[] | null>(null);
  const [cantidad, setCantidad] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [negativos, setNegativos] = useState<Negativo[] | null>(null);

  useEffect(() => {
    fetch(`/api/inventarios/recetas?producto_terminado_id=${itemId}`)
      .then((r) => r.json())
      .then((d) => setReceta(d.success ? d.data : []))
      .catch(() => setReceta([]));
  }, [itemId]);

  const cant = parseFloat(cantidad) || 0;

  const preview = useMemo(() => {
    if (!receta) return [];
    return receta.map((l) => {
      const consumo = l.cantidad_requerida * cant;
      const resultante = l.insumo.stock_actual - consumo;
      return { ...l, consumo, resultante };
    });
  }, [receta, cant]);

  async function handleConfirmar() {
    setError("");
    if (isNaN(cant) || cant <= 0) {
      setError("La cantidad a producir debe ser mayor a 0");
      return;
    }
    setCargando(true);
    try {
      const res = await fetch("/api/inventarios/produccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, cantidad: cant, notas: notas || null }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al registrar la producción");
        setCargando(false);
        return;
      }
      router.refresh();
      if (data.data.negativos && data.data.negativos.length > 0) {
        setNegativos(data.data.negativos);
        setCargando(false);
      } else {
        onCerrar();
      }
    } catch {
      setError("Error de conexión");
      setCargando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Registrar producción</h2>
          <button onClick={onCerrar} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {negativos ? (
          <div className="p-6 space-y-4">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-1">
                Producción registrada, pero algunos insumos quedaron con stock negativo
              </p>
              <p className="text-xs text-yellow-700">Revisa y reabastece lo antes posible.</p>
            </div>
            <div className="space-y-2">
              {negativos.map((n) => (
                <div key={n.id} className="flex items-center justify-between px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{n.nombre}</span>
                  <span className="text-sm font-semibold text-red-700">{n.stock_resultante} {n.unidad}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={onCerrar} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors">
                Entendido
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{itemNombre}</p>
              <p className="text-xs text-gray-500">Stock actual: {stockActual} {itemUnidad}</p>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a producir ({itemUnidad})</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="0"
                step="0.01"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              {cantidad && (
                <p className="text-xs text-gray-500 mt-1">
                  Stock resultante: {(stockActual + cant).toFixed(2)} {itemUnidad}
                </p>
              )}
            </div>

            {receta === null ? (
              <p className="text-sm text-gray-400">Cargando receta...</p>
            ) : receta.length === 0 ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                Este producto no tiene receta asignada. La producción solo sumará stock, sin consumir insumos.
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Insumos que se consumirán</p>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-50">
                  {preview.map((l) => (
                    <div key={l.id} className="px-3 py-2 flex items-center justify-between text-sm">
                      <span className="text-gray-700">{l.insumo.nombre}</span>
                      <div className="text-right">
                        <span className="text-gray-900 font-medium">-{l.consumo.toFixed(2)} {l.insumo.unidad}</span>
                        <span className={`ml-2 text-xs ${l.resultante < 0 ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                          → {l.resultante.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onCerrar} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="button" onClick={handleConfirmar} disabled={cargando || receta === null}
                className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2">
                {cargando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Confirmar producción
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
