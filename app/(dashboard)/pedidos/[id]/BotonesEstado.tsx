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
      const res = await fetch(`/api/pedidos/${pedidoId}/estado`, {
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

  // en_reparto/devuelto son transiciones habilitadas para el flujo del
  // repartidor (ver mini-dashboard); el admin no necesita estos botones aquí.
  // "cancelado" no se muestra aquí — vive aparte, en la zona de acciones
  // destructivas al final de la página (ver CancelarPedido.tsx), para que no
  // quede al lado de los botones normales de avance de estado.
  const positivas = transiciones.filter(
    (t) => t !== "cancelado" && t !== "en_reparto" && t !== "devuelto"
  );

  if (positivas.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
      {error && (
        <span className="text-red-500 text-xs">{error}</span>
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
            className={`h-11 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${estilo.clase}`}
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
