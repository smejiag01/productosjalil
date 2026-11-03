"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";


import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass, textareaClass } from "@/components/ui/clases";
import Modal from "@/components/ui/Modal";
interface Props {
  itemId: string;
  itemNombre: string;
  itemUnidad: string;
  stockActual: number;
  onCerrar: () => void;
}

const TIPOS = [
  { valor: "entrada", label: "Entrada" },
  { valor: "salida", label: "Salida" },
  { valor: "ajuste", label: "Ajuste" },
];

const MOTIVOS: Record<string, { valor: string; label: string }[]> = {
  entrada: [
    { valor: "compra", label: "Compra" },
    { valor: "produccion", label: "Producción" },
    { valor: "ajuste_manual", label: "Ajuste manual" },
  ],
  salida: [
    { valor: "venta", label: "Venta" },
    { valor: "merma", label: "Merma" },
    { valor: "produccion", label: "Producción" },
    { valor: "ajuste_manual", label: "Ajuste manual" },
  ],
  ajuste: [
    { valor: "ajuste_manual", label: "Ajuste manual" },
  ],
};

export default function ModalMovimiento({ itemId, itemNombre, itemUnidad, stockActual, onCerrar }: Props) {
  const router = useRouter();
  const [tipo, setTipo] = useState("entrada");
  const [motivo, setMotivo] = useState("compra");
  const [cantidad, setCantidad] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function handleTipoChange(nuevoTipo: string) {
    setTipo(nuevoTipo);
    setMotivo(MOTIVOS[nuevoTipo][0].valor);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const cant = parseFloat(cantidad);
    if (isNaN(cant) || cant <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }
    setCargando(true);

    try {
      const res = await fetch("/api/inventarios/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, tipo, motivo, cantidad: cant, notas: notas || null }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al registrar movimiento");
        setCargando(false);
        return;
      }
      router.refresh();
      onCerrar();
    } catch {
      setError("Error de conexión");
      setCargando(false);
    }
  }

  const stockResultante =
    tipo === "entrada" ? stockActual + (parseFloat(cantidad) || 0) :
    tipo === "salida" ? stockActual - (parseFloat(cantidad) || 0) :
    parseFloat(cantidad) || 0;

  return (
    <Modal open onClose={onCerrar} title={"Registrar movimiento"} size="md">

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-ink-50 rounded-control">
            <p className="text-sm font-medium text-ink-900">{itemNombre}</p>
            <p className="text-xs text-ink-600">Stock actual: {stockActual} {itemUnidad}</p>
          </div>

          {error && <div role="alert" className="p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-2">Tipo de movimiento</label>
            <div className="flex gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  onClick={() => handleTipoChange(t.valor)}
                  className={`flex-1 h-10 rounded-control text-sm font-medium transition-colors border ${
                    tipo === t.valor
                      ? t.valor === "entrada" ? "bg-ok-soft border-ok/30 text-ok"
                        : t.valor === "salida" ? "bg-danger-soft border-danger/30 text-danger"
                        : "bg-info-soft border-info/30 text-info"
                      : "bg-white border-ink-200 text-ink-700 hover:bg-ink-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Motivo</label>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)}
              className={inputClass()}>
              {MOTIVOS[tipo].map((m) => (
                <option key={m.valor} value={m.valor}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              {tipo === "ajuste" ? "Nuevo stock" : "Cantidad"} ({itemUnidad})
            </label>
            <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              min="0" step="0.01" required
              className={inputClass()} />
            {cantidad && (
              <p className={`text-xs mt-1 ${stockResultante < 0 ? "text-danger" : "text-ink-600"}`}>
                Stock resultante: {stockResultante.toFixed(2)} {itemUnidad}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Notas (opcional)</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2}
              className={textareaClass({ className: "resize-none" })} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className={buttonClass({ variant: "secondary" })}>Cancelar</button>
            <button type="submit" disabled={cargando}
              className={buttonClass()}>
              {cargando && <Spinner size="sm" />}
              Registrar
            </button>
          </div>
        </form>
    </Modal>
  );
}
