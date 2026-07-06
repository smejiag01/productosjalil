"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Pedido {
  rutaId: string | null;
  rutaNombre: string;
  estado: string;
}

export default function DespacharRutas({
  pedidos,
  fecha,
}: {
  pedidos: Pedido[];
  fecha: string;
}) {
  const router = useRouter();
  const [despachando, setDespachando] = useState<string | null>(null);
  const [error, setError] = useState("");

  const rutas = useMemo(() => {
    const mapa = new Map<string, { nombre: string; confirmados: number }>();
    for (const p of pedidos) {
      if (!p.rutaId) continue;
      if (!mapa.has(p.rutaId)) mapa.set(p.rutaId, { nombre: p.rutaNombre, confirmados: 0 });
      if (p.estado === "confirmado") mapa.get(p.rutaId)!.confirmados += 1;
    }
    return Array.from(mapa.entries())
      .map(([id, v]) => ({ id, ...v }))
      .filter((r) => r.confirmados > 0);
  }, [pedidos]);

  async function despacharRuta(rutaId: string) {
    if (!confirm("¿Despachar esta ruta? Todos los pedidos confirmados pasarán a \"En reparto\".")) return;
    setDespachando(rutaId);
    setError("");
    try {
      const res = await fetch("/api/pedidos/despachar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruta_id: rutaId, fecha }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al despachar la ruta");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setDespachando(null);
    }
  }

  if (rutas.length === 0) return null;

  return (
    <div className="mb-6">
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}
      <div className="flex flex-wrap gap-2">
        {rutas.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg pl-3 pr-1.5 py-1.5"
          >
            <span className="text-sm text-gray-700">
              🗺️ <span className="font-medium">{r.nombre}</span>
              <span className="text-gray-400"> · {r.confirmados} confirmado{r.confirmados !== 1 ? "s" : ""}</span>
            </span>
            <button
              onClick={() => despacharRuta(r.id)}
              disabled={despachando === r.id}
              className="h-9 px-3 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {despachando === r.id ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "🚚 Despachar"
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
