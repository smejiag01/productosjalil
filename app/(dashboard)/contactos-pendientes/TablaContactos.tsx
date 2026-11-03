"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Phone } from "@/components/ui/icons";
interface Contacto {
  id: string;
  telefono: string;
  nombrePerfil: string | null;
  motivo: string;
  telefonoContacto: string | null;
  nitIntentado: string | null;
  notas: string | null;
  atendido: boolean;
  fecha: string;
}

const MOTIVO_LABELS: Record<string, string> = {
  cliente_nuevo: "Cliente nuevo",
  no_pedir_bot: "Prefiere que lo llamen",
  pedido_mismo_dia: "Pedido para hoy",
};

const MOTIVO_COLORES: Record<string, string> = {
  cliente_nuevo: "bg-info-soft border-info/30 text-info",
  no_pedir_bot: "bg-info-soft border-info/30 text-info",
  pedido_mismo_dia: "bg-warn-soft border-warn/30 text-warn-soft-text",
};

const FILTROS: { key: string; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendientes", label: "Pendientes" },
  { key: "atendidos", label: "Atendidos" },
];

function urlWhatsapp(telefono: string): string {
  const limpio = telefono.replace(/[^\d]/g, "");
  return `https://wa.me/${limpio}`;
}

export default function TablaContactos({ contactos: iniciales }: { contactos: Contacto[] }) {
  const router = useRouter();
  const [contactos, setContactos] = useState(iniciales);
  const [filtro, setFiltro] = useState("todos");
  const [cargandoId, setCargandoId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const contadores = {
    pendientes: contactos.filter((c) => !c.atendido).length,
    atendidos: contactos.filter((c) => c.atendido).length,
    todos: contactos.length,
  };

  const filtrados = contactos.filter((c) => {
    if (filtro === "pendientes") return !c.atendido;
    if (filtro === "atendidos") return c.atendido;
    return true;
  });

  async function actualizar(id: string, body: Record<string, unknown>) {
    setError("");
    setCargandoId(id);
    try {
      const res = await fetch(`/api/contactos-pendientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al actualizar el contacto");
        return;
      }
      setContactos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...body } as Contacto : c))
      );
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargandoId(null);
    }
  }

  function guardarNotas(id: string, notas: string, notasOriginales: string | null) {
    if (notas === (notasOriginales ?? "")) return;
    actualizar(id, { notas });
  }

  const estadoVacio = (
    <div className="py-16 text-center text-ink-500">
      <Phone aria-hidden="true" className="w-12 h-12 text-ink-300 mx-auto mb-3" />
      <p className="text-sm">
        {filtro === "pendientes"
          ? "No hay nadie pendiente por contactar"
          : filtro === "atendidos"
            ? "Aún no hay contactos marcados como atendidos"
            : "No hay contactos registrados"}
      </p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        {FILTROS.map((f) => {
          const activo = filtro === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`h-10 px-3 lg:px-4 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                activo ? "bg-brand text-white" : "bg-white border border-ink-200 text-ink-700 hover:bg-ink-50"
              }`}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activo ? "bg-white/20" : "bg-ink-100 text-ink-600"}`}>
                {contadores[f.key as keyof typeof contadores]}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{error}</div>
      )}

      {/* Cards móvil/tablet */}
      <div className="lg:hidden space-y-3">
        {filtrados.length === 0 ? (
          <div className="bg-white rounded-card border border-ink-200 shadow-card">{estadoVacio}</div>
        ) : (
          filtrados.map((c) => (
            <div key={c.id} className="bg-white rounded-card border border-ink-200 shadow-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{c.nombrePerfil || "Sin nombre"}</p>
                  <p className="text-xs text-ink-500">{c.telefono} · {c.fecha}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${MOTIVO_COLORES[c.motivo] ?? "bg-ink-50 border-ink-200 text-ink-800"}`}>
                  {MOTIVO_LABELS[c.motivo] ?? c.motivo}
                </span>
              </div>
              {c.nitIntentado && <p className="text-xs text-ink-600 mb-2">NIT intentado: {c.nitIntentado}</p>}
              <textarea
                defaultValue={c.notas ?? ""}
                placeholder="Notas de la llamada..."
                onBlur={(e) => guardarNotas(c.id, e.target.value, c.notas)}
                className="w-full text-xs border border-ink-200 rounded-control px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand mb-3"
                rows={2}
              />
              <div className="flex items-center justify-between pt-2 border-t border-ink-100 gap-2">
                <a
                  href={urlWhatsapp(c.telefono)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3 bg-ok-soft border border-ok/30 text-ok rounded-control text-xs font-medium flex items-center gap-1.5"
                >
                  WhatsApp
                </a>
                <button
                  onClick={() => actualizar(c.id, { atendido: !c.atendido })}
                  disabled={cargandoId === c.id}
                  className={`h-9 px-3 rounded-control text-xs font-medium disabled:opacity-50 ${
                    c.atendido
                      ? "bg-ink-50 border border-ink-200 text-ink-700"
                      : "bg-brand text-white"
                  }`}
                >
                  {c.atendido ? "Marcar pendiente" : "Marcar atendido"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Teléfono</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Nombre de perfil</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Motivo</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">NIT intentado</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Fecha</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Notas</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {filtrados.length === 0 ? (
              <tr><td colSpan={8}>{estadoVacio}</td></tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.id} className="hover:bg-ink-50/50 transition-colors align-top">
                  <td className="py-3 px-4 text-sm font-medium text-ink-900 whitespace-nowrap">{c.telefono}</td>
                  <td className="py-3 px-4 text-sm text-ink-700">{c.nombrePerfil || "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${MOTIVO_COLORES[c.motivo] ?? "bg-ink-50 border-ink-200 text-ink-800"}`}>
                      {MOTIVO_LABELS[c.motivo] ?? c.motivo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-700">{c.nitIntentado || "—"}</td>
                  <td className="py-3 px-4 text-sm text-ink-600 whitespace-nowrap">{c.fecha}</td>
                  <td className="py-3 px-4 min-w-[220px]">
                    <textarea
                      defaultValue={c.notas ?? ""}
                      placeholder="Notas de la llamada..."
                      onBlur={(e) => guardarNotas(c.id, e.target.value, c.notas)}
                      className="w-full text-xs border border-ink-200 rounded-control px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      rows={2}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${c.atendido ? "bg-ok-soft border-ok/30 text-ok" : "bg-warn-soft border-warn/30 text-warn-soft-text"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.atendido ? "bg-ok" : "bg-warn"}`} />
                      {c.atendido ? "Atendido" : "Pendiente"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <a
                        href={urlWhatsapp(c.telefono)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-ok hover:text-ok font-medium whitespace-nowrap"
                      >
                        WhatsApp
                      </a>
                      <button
                        onClick={() => actualizar(c.id, { atendido: !c.atendido })}
                        disabled={cargandoId === c.id}
                        className="text-sm text-brand hover:text-brand-700 font-medium disabled:opacity-50 whitespace-nowrap"
                      >
                        {c.atendido ? "Marcar pendiente" : "Marcar atendido"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
