"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Route, Truck } from "@/components/ui/icons";
import { useConfirmar } from "@/components/ui/useConfirmar";
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
  const { confirmar, dialogo } = useConfirmar();

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
    const acepto = await confirmar({
      title: "¿Despachar esta ruta?",
      description: 'Todos los pedidos confirmados de la ruta pasarán a "En reparto".',
      confirmLabel: "Despachar",
    });
    if (!acepto) return;
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
        <Alert tone="error" className="mb-3">
          {error}
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        {rutas.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-card border border-ink-200 bg-white py-1.5 pl-3 pr-1.5 shadow-card"
          >
            <span className="flex items-center gap-2 text-sm text-ink-800">
              <Route aria-hidden="true" className="h-4 w-4 text-brand-700" />
              <span className="font-semibold">{r.nombre}</span>
              <span className="text-ink-600">
                · {r.confirmados} confirmado{r.confirmados !== 1 ? "s" : ""}
              </span>
            </span>
            <Button
              size="sm"
              onClick={() => despacharRuta(r.id)}
              loading={despachando === r.id}
              leftIcon={<Truck aria-hidden="true" className="h-4 w-4" />}
            >
              Despachar
            </Button>
          </div>
        ))}
      </div>
      {dialogo}
    </div>
  );
}
