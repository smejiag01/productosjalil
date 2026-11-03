"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

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
  return (
    <Modal
      open
      onClose={onCerrar}
      title="¿Cancelar este pedido?"
      size="sm"
      dismissible={!cargando}
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar} disabled={cargando}>
            No, volver
          </Button>
          <Button variant="danger" onClick={onConfirmar} loading={cargando}>
            Sí, cancelar pedido
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        <dl className="space-y-1.5 rounded-control border border-ink-200 bg-ink-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-700">Cliente</dt>
            <dd className="font-medium text-ink-900">{clienteNombre}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-700">Pedido</dt>
            <dd className="font-medium text-ink-900">{numeroPedido}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-700">Total</dt>
            <dd className="font-semibold text-ink-900">{total}</dd>
          </div>
        </dl>

        <Alert tone="warning">Esta acción no se puede deshacer.</Alert>
      </div>
    </Modal>
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
    <div className="mt-8 pt-6 border-t border-ink-200">
      <button
        onClick={() => { setError(""); setModalAbierto(true); }}
        className="min-h-11 text-sm font-medium text-danger hover:underline"
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
