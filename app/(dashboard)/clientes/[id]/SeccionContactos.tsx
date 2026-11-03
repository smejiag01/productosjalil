"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalContacto from "./ModalContacto";

import { Plus } from "@/components/ui/icons";
import { useConfirmar } from "@/components/ui/useConfirmar";
interface Contacto {
  id: string;
  telefono: string;
  nombre: string | null;
  principal: boolean;
  verificado: boolean;
  origen: string;
}

const ORIGEN_LABELS: Record<string, string> = {
  manual: "Agregado manualmente",
  migracion: "Migración inicial",
  whatsapp_nit: "Vinculado por NIT (WhatsApp)",
  whatsapp_tel: "Vinculado por teléfono (WhatsApp)",
};

export default function SeccionContactos({ clienteId, contactosIniciales }: { clienteId: string; contactosIniciales: Contacto[] }) {
  const router = useRouter();
  const { confirmar, dialogo } = useConfirmar();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Contacto | null>(null);
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function actualizar(contacto: Contacto, body: Record<string, unknown>) {
    setCargando(contacto.id);
    setError("");
    try {
      const res = await fetch(`/api/clientes/${clienteId}/contactos/${contacto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al actualizar el contacto");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(null);
    }
  }

  async function eliminar(contacto: Contacto) {
    const acepto = await confirmar({
      title: "¿Eliminar este contacto?",
      description: `Se quitará el número ${contacto.telefono} del cliente.`,
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!acepto) return;
    setCargando(contacto.id);
    setError("");
    try {
      const res = await fetch(`/api/clientes/${clienteId}/contactos/${contacto.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al eliminar el contacto");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(null);
    }
  }

  return (
    <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-ink-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ink-900">Contactos</h3>
          <p className="text-xs text-ink-500 mt-0.5">Números desde los que pueden hacer pedidos por WhatsApp</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className="h-9 px-3 bg-brand text-white rounded-control text-xs font-medium hover:bg-brand-700 transition-colors flex items-center gap-1.5"
        >
          <Plus aria-hidden="true" className="w-3.5 h-3.5" />
          Agregar contacto
        </button>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{error}</div>
      )}

      {contactosIniciales.length === 0 ? (
        <div className="py-10 text-center text-ink-500 text-sm">Sin contactos registrados aún</div>
      ) : (
        <div className="divide-y divide-ink-50">
          {contactosIniciales.map((c) => (
            <div
              key={c.id}
              className={`px-4 sm:px-6 py-3 flex items-start justify-between gap-3 ${!c.verificado ? "bg-warn-soft" : ""}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-ink-900">{c.telefono}</p>
                  {c.nombre && <span className="text-sm text-ink-600">· {c.nombre}</span>}
                  {c.principal && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">Principal</span>
                  )}
                  {c.verificado ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-ok-soft text-ok border border-ok/30 font-medium">Verificado</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-warn-soft text-warn-soft-text border border-warn/30 font-medium">
                      Número nuevo — sin verificar
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-500 mt-0.5">{ORIGEN_LABELS[c.origen] ?? c.origen}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3 flex-shrink-0">
                {!c.verificado && (
                  <button
                    onClick={() => actualizar(c, { verificado: true })}
                    disabled={cargando === c.id}
                    className="text-xs font-medium text-warn-soft-text hover:text-warn-soft-text disabled:opacity-50 whitespace-nowrap"
                  >
                    Verificar
                  </button>
                )}
                {!c.principal && (
                  <button
                    onClick={() => actualizar(c, { principal: true })}
                    disabled={cargando === c.id}
                    className="text-xs font-medium text-brand hover:text-brand-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    Marcar principal
                  </button>
                )}
                <button
                  onClick={() => { setEditando(c); setModalAbierto(true); }}
                  className="text-xs font-medium text-ink-700 hover:text-ink-900 whitespace-nowrap"
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminar(c)}
                  disabled={cargando === c.id}
                  className="text-xs font-medium text-danger hover:text-danger disabled:opacity-50 whitespace-nowrap"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAbierto && (
        <ModalContacto
          clienteId={clienteId}
          contactoInicial={editando}
          onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        />
      )}
      {dialogo}
    </div>
  );
}
