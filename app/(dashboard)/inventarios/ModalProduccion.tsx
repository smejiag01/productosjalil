"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";


import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass, textareaClass } from "@/components/ui/clases";
import Modal from "@/components/ui/Modal";
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
    <Modal open onClose={onCerrar} title={"Registrar producción"} size="md">

        {negativos ? (
          <div className="space-y-4">
            <div className="p-3 bg-warn-soft border border-warn/30 rounded-lg">
              <p className="text-sm font-medium text-warn-soft-text mb-1">
                Producción registrada, pero algunos insumos quedaron con stock negativo
              </p>
              <p className="text-xs text-warn-soft-text">Revisa y reabastece lo antes posible.</p>
            </div>
            <div className="space-y-2">
              {negativos.map((n) => (
                <div key={n.id} className="flex items-center justify-between px-3 py-2 bg-danger-soft border border-danger/30 rounded-lg">
                  <span className="text-sm font-medium text-ink-900">{n.nombre}</span>
                  <span className="text-sm font-semibold text-danger">{n.stock_resultante} {n.unidad}</span>
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
          <div className="space-y-4">
            <div className="p-3 bg-ink-50 rounded-lg">
              <p className="text-sm font-medium text-ink-900">{itemNombre}</p>
              <p className="text-xs text-ink-600">Stock actual: {stockActual} {itemUnidad}</p>
            </div>

            {error && <div role="alert" className="p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">Cantidad a producir ({itemUnidad})</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="0"
                step="0.01"
                autoFocus
                className={inputClass()}
              />
              {cantidad && (
                <p className="text-xs text-ink-600 mt-1">
                  Stock resultante: {(stockActual + cant).toFixed(2)} {itemUnidad}
                </p>
              )}
            </div>

            {receta === null ? (
              <p className="text-sm text-ink-500">Cargando receta...</p>
            ) : receta.length === 0 ? (
              <div className="p-3 bg-info-soft border border-info/30 rounded-lg text-info text-sm">
                Este producto no tiene receta asignada. La producción solo sumará stock, sin consumir insumos.
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-ink-800 mb-2">Insumos que se consumirán</p>
                <div className="border border-ink-200 rounded-lg divide-y divide-ink-50">
                  {preview.map((l) => (
                    <div key={l.id} className="px-3 py-2 flex items-center justify-between text-sm">
                      <span className="text-ink-800">{l.insumo.nombre}</span>
                      <div className="text-right">
                        <span className="text-ink-900 font-medium">-{l.consumo.toFixed(2)} {l.insumo.unidad}</span>
                        <span className={`ml-2 text-xs ${l.resultante < 0 ? "text-danger font-semibold" : "text-ink-500"}`}>
                          → {l.resultante.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">Notas (opcional)</label>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2}
                className={textareaClass({ className: "resize-none" })} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onCerrar} className={buttonClass({ variant: "secondary" })}>Cancelar</button>
              <button type="button" onClick={handleConfirmar} disabled={cargando || receta === null}
                className={buttonClass()}>
                {cargando && <Spinner size="sm" />}
                Confirmar producción
              </button>
            </div>
          </div>
        )}
    </Modal>
  );
}
