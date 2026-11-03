"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalSede from "./ModalSede";

import { Plus } from "@/components/ui/icons";
interface Sede {
  id: string;
  nombre_sede: string;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  es_principal: boolean;
  activa: boolean;
}

export default function SeccionSedes({ clienteId, sedesIniciales }: { clienteId: string; sedesIniciales: Sede[] }) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Sede | null>(null);
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function marcarPrincipal(sede: Sede) {
    setCargando(sede.id);
    setError("");
    try {
      const res = await fetch(`/api/sedes/${sede.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ es_principal: true }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al marcar como principal");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(null);
    }
  }

  async function toggleActiva(sede: Sede) {
    setCargando(sede.id);
    setError("");
    try {
      const res = await fetch(`/api/sedes/${sede.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !sede.activa }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al actualizar la sede");
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
          <h3 className="font-semibold text-ink-900">Sedes</h3>
          <p className="text-xs text-ink-500 mt-0.5">Direcciones de entrega del cliente</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className="h-9 px-3 bg-brand text-white rounded-lg text-xs font-medium hover:bg-brand-light transition-colors flex items-center gap-1.5"
        >
          <Plus aria-hidden="true" className="w-3.5 h-3.5" />
          Agregar sede
        </button>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{error}</div>
      )}

      {sedesIniciales.length === 0 ? (
        <div className="py-10 text-center text-ink-500 text-sm">Sin sedes registradas aún</div>
      ) : (
        <div className="divide-y divide-ink-50">
          {sedesIniciales.map((s) => (
            <div key={s.id} className="px-4 sm:px-6 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-ink-900">{s.nombre_sede}</p>
                  {s.es_principal && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">Principal</span>
                  )}
                  {!s.activa && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 font-medium">Inactiva</span>
                  )}
                </div>
                {s.direccion && <p className="text-xs text-ink-600 mt-0.5">{s.direccion}</p>}
                {s.latitud != null && s.longitud != null && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${s.latitud},${s.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-block text-xs font-medium text-brand-700 hover:underline"
                  >
                    Ver en Google Maps
                  </a>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3 flex-shrink-0">
                {!s.es_principal && (
                  <button
                    onClick={() => marcarPrincipal(s)}
                    disabled={cargando === s.id}
                    className="text-xs font-medium text-brand hover:text-brand-light disabled:opacity-50 whitespace-nowrap"
                  >
                    Marcar principal
                  </button>
                )}
                <button
                  onClick={() => { setEditando(s); setModalAbierto(true); }}
                  className="text-xs font-medium text-ink-700 hover:text-ink-900 whitespace-nowrap"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActiva(s)}
                  disabled={cargando === s.id}
                  className={`text-xs font-medium disabled:opacity-50 whitespace-nowrap ${s.activa ? "text-danger hover:text-danger" : "text-ok hover:text-ok"}`}
                >
                  {s.activa ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAbierto && (
        <ModalSede
          clienteId={clienteId}
          sedeInicial={editando}
          onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
