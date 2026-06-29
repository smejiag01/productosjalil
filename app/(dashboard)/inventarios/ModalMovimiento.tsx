"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Registrar movimiento</h2>
          <button onClick={onCerrar} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{itemNombre}</p>
            <p className="text-xs text-gray-500">Stock actual: {stockActual} {itemUnidad}</p>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de movimiento</label>
            <div className="flex gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  onClick={() => handleTipoChange(t.valor)}
                  className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors border ${
                    tipo === t.valor
                      ? t.valor === "entrada" ? "bg-green-50 border-green-300 text-green-800"
                        : t.valor === "salida" ? "bg-red-50 border-red-300 text-red-800"
                        : "bg-blue-50 border-blue-300 text-blue-800"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
              {MOTIVOS[tipo].map((m) => (
                <option key={m.valor} value={m.valor}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tipo === "ajuste" ? "Nuevo stock" : "Cantidad"} ({itemUnidad})
            </label>
            <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              min="0" step="0.01" required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            {cantidad && (
              <p className={`text-xs mt-1 ${stockResultante < 0 ? "text-red-500" : "text-gray-500"}`}>
                Stock resultante: {stockResultante.toFixed(2)} {itemUnidad}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={cargando}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2">
              {cargando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
