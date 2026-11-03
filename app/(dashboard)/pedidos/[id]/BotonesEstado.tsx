"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS, type EstadoPedido } from "@/lib/pedidos";

import { Check, Package } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
interface Props {
  pedidoId: string;
  transiciones: EstadoPedido[];
}

const ESTILOS_BOTON: Record<
  string,
  { clase: string; icono: React.ReactNode }
> = {
  en_proceso: {
    clase: "bg-info text-white hover:bg-[#184B6E]",
    icono: (
      <Check aria-hidden="true" className="w-4 h-4" />
    ),
  },
  confirmado: {
    clase: "bg-ok text-white hover:bg-[#245A34]",
    icono: (
      <Check aria-hidden="true" className="w-4 h-4" />
    ),
  },
  entregado: {
    clase: "bg-ink-800 text-white hover:bg-ink-800",
    icono: (
      <Package aria-hidden="true" className="w-4 h-4" />
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
        <span className="text-danger text-xs">{error}</span>
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
            className={`h-11 px-4 rounded-control text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${estilo.clase}`}
          >
            {cargando === t ? (
              <Spinner size="sm" />
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
