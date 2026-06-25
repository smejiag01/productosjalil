"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS, type EstadoPedido } from "@/lib/pedidos";

interface Props {
  pedidoId: string;
  transiciones: EstadoPedido[];
}

const ESTILOS_BOTON: Record<
  string,
  { clase: string; icono: React.ReactNode }
> = {
  en_proceso: {
    clase: "bg-blue-600 text-white hover:bg-blue-700",
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  confirmado: {
    clase: "bg-green-600 text-white hover:bg-green-700",
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  entregado: {
    clase: "bg-gray-700 text-white hover:bg-gray-800",
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    ),
  },
  cancelado: {
    clase: "bg-white border border-red-300 text-red-600 hover:bg-red-50",
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
};

export default function BotonesEstado({
  pedidoId,
  transiciones,
}: Props) {
  const router = useRouter();
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (transiciones.length === 0) return null;

  async function cambiarEstado(nuevoEstado: EstadoPedido) {
    setCargando(nuevoEstado);
    setError("");

    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Error al actualizar el estado");
        setCargando(null);
        return;
      }

      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(null);
    }
  }

  const cancelar = transiciones.find((t) => t === "cancelado");
  const positivas = transiciones.filter((t) => t !== "cancelado");

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      {error && (
        <span className="text-red-500 text-xs mr-2">{error}</span>
      )}
      {cancelar && (
        <button
          onClick={() => cambiarEstado("cancelado")}
          disabled={cargando !== null}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${ESTILOS_BOTON.cancelado.clase}`}
        >
          {cargando === "cancelado" ? (
            <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
          ) : (
            ESTILOS_BOTON.cancelado.icono
          )}
          Cancelar
        </button>
      )}
      {positivas.map((t) => {
        const estilo = ESTILOS_BOTON[t] ?? ESTILOS_BOTON.confirmado;
        const label =
          t === "en_proceso"
            ? "Procesar"
            : t === "confirmado"
              ? "Confirmar"
              : t === "entregado"
                ? "Marcar entregado"
                : ESTADOS[t].label;
        return (
          <button
            key={t}
            onClick={() => cambiarEstado(t)}
            disabled={cargando !== null}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${estilo.clase}`}
          >
            {cargando === t ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              estilo.icono
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}
