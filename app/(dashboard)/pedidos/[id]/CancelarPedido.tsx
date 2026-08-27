"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  pedidoId: string;
  numeroPedido: string;
  clienteNombre: string;
  total: string;
}

function ModalConfirmarCancelacion({
  numeroPedido,
  clienteNombre,
  total,
  cargando,
  error,
  onConfirmar,
  onCerrar,
}: {
  numeroPedido: string;
  clienteNombre: string;
  total: string;
  cargando: boolean;
  error: string;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  const contenidoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [onCerrar]);

  function alHacerClicFondo(e: React.MouseEvent<HTMLDivElement>) {
    if (contenidoRef.current && !contenidoRef.current.contains(e.target as Node)) {
      onCerrar();
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={alHacerClicFondo}
    >
      <div ref={contenidoRef} className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-md">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">¿Cancelar este pedido?</h2>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cliente</span>
              <span className="font-medium text-gray-900">{clienteNombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pedido</span>
              <span className="font-medium text-gray-900">{numeroPedido}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold text-gray-900">{total}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Esta acción no se puede deshacer.</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              disabled={cargando}
              className="h-11 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50"
            >
              No, volver
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={cargando}
              className="h-11 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cargando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Sí, cancelar pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CancelarPedido({ pedidoId, numeroPedido, clienteNombre, total }: Props) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function confirmarCancelacion() {
    setCargando(true);
    setError("");

    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "cancelado" }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Error al cancelar el pedido");
        setCargando(false);
        return;
      }

      router.refresh();
      setModalAbierto(false);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <button
        onClick={() => { setError(""); setModalAbierto(true); }}
        className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
      >
        Cancelar pedido
      </button>

      {modalAbierto && (
        <ModalConfirmarCancelacion
          numeroPedido={numeroPedido}
          clienteNombre={clienteNombre}
          total={total}
          cargando={cargando}
          error={error}
          onConfirmar={confirmarCancelacion}
          onCerrar={() => !cargando && setModalAbierto(false)}
        />
      )}
    </div>
  );
}
