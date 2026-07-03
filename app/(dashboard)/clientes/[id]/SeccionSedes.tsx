"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalSede from "./ModalSede";

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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Sedes</h3>
          <p className="text-xs text-gray-400 mt-0.5">Direcciones de entrega del cliente</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className="h-9 px-3 bg-brand text-white rounded-lg text-xs font-medium hover:bg-brand-light transition-colors flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar sede
        </button>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {sedesIniciales.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-sm">Sin sedes registradas aún</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {sedesIniciales.map((s) => (
            <div key={s.id} className="px-4 sm:px-6 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{s.nombre_sede}</p>
                  {s.es_principal && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">Principal</span>
                  )}
                  {!s.activa && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Inactiva</span>
                  )}
                </div>
                {s.direccion && <p className="text-xs text-gray-500 mt-0.5">{s.direccion}</p>}
                {s.latitud != null && s.longitud != null && (
                  <p className="text-xs text-gray-400 mt-0.5">{s.latitud}, {s.longitud}</p>
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
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActiva(s)}
                  disabled={cargando === s.id}
                  className={`text-xs font-medium disabled:opacity-50 whitespace-nowrap ${s.activa ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}`}
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
