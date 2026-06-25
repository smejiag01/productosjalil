"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  config: {
    hora_recordatorio: string;
    horas_espera_followup: number;
    mensaje_recordatorio: string;
    mensaje_followup: string;
  };
  onGuardado: (msg: string) => void;
}

function PreviewMensaje({ texto }: { texto: string }) {
  const interpolado = texto.replace(/\{nombre\}/g, "Cliente de prueba");
  return (
    <div className="bg-[#DCF8C6] rounded-lg rounded-tl-none px-3 py-2 text-sm text-gray-800 max-w-xs shadow-sm">
      {interpolado}
      <div className="text-[10px] text-gray-500 text-right mt-1">
        {new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

export default function SeccionWhatsApp({ config, onGuardado }: Props) {
  const router = useRouter();
  const [hora, setHora] = useState(config.hora_recordatorio);
  const [horasEspera, setHorasEspera] = useState(config.horas_espera_followup.toString());
  const [mensajeRecordatorio, setMensajeRecordatorio] = useState(config.mensaje_recordatorio);
  const [mensajeFollowup, setMensajeFollowup] = useState(config.mensaje_followup);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hora_recordatorio: `1970-01-01T${hora}:00.000Z`,
          horas_espera_followup: parseInt(horasEspera) || 3,
          mensaje_recordatorio: mensajeRecordatorio,
          mensaje_followup: mensajeFollowup,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      } else {
        onGuardado("Configuración de mensajes actualizada");
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Mensajes de WhatsApp
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Configura los mensajes automáticos que se envían a los clientes
      </p>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs flex items-start gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        Los cambios aquí se aplicarán automáticamente en el próximo envío programado
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Horarios */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de envío del recordatorio
            </label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horas de espera antes del seguimiento
            </label>
            <div className="flex items-center gap-2">
              <input type="number" value={horasEspera} onChange={(e) => setHorasEspera(e.target.value)}
                min="1" max="24"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
              <span className="text-sm text-gray-500">horas</span>
            </div>
          </div>
        </div>

        {/* Mensaje recordatorio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje de recordatorio
          </label>
          <textarea value={mensajeRecordatorio} onChange={(e) => setMensajeRecordatorio(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
            placeholder="Usa {nombre} para insertar el nombre del cliente" />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">
              Usa <code className="bg-gray-100 px-1 rounded">{"{nombre}"}</code> para el nombre del cliente
            </p>
            <p className="text-xs text-gray-400">{mensajeRecordatorio.length} caracteres</p>
          </div>
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
            <PreviewMensaje texto={mensajeRecordatorio} />
          </div>
        </div>

        {/* Mensaje seguimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje de seguimiento
          </label>
          <textarea value={mensajeFollowup} onChange={(e) => setMensajeFollowup(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
            placeholder="Usa {nombre} para insertar el nombre del cliente" />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">
              Se envía si no responden después de {horasEspera || "N"} horas
            </p>
            <p className="text-xs text-gray-400">{mensajeFollowup.length} caracteres</p>
          </div>
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
            <PreviewMensaje texto={mensajeFollowup} />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={cargando}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2">
            {cargando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
