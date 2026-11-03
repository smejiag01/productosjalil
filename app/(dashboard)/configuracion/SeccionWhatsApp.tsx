"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AlertCircle } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass } from "@/components/ui/clases";
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
    <div className="bg-[#DCF8C6] rounded-lg rounded-tl-none px-3 py-2 text-sm text-ink-800 max-w-[280px] shadow-sm mx-auto">
      {interpolado}
      <div className="text-[10px] text-ink-600 text-right mt-1">
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
    <div className="bg-white rounded-card border border-ink-200 shadow-card p-4 sm:p-6 max-w-3xl">
      <h2 className="text-lg font-semibold text-ink-900 mb-1">
        Mensajes de WhatsApp
      </h2>
      <p className="text-sm text-ink-600 mb-6">
        Configura los mensajes automáticos que se envían a los clientes
      </p>

      <div className="mb-4 p-3 bg-info-soft border border-info/30 rounded-lg text-info text-xs flex items-start gap-2">
        <AlertCircle aria-hidden="true" className="w-4 h-4 mt-0.5 flex-shrink-0" />
        Los cambios aquí se aplicarán automáticamente en el próximo envío programado
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Horarios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              Hora de envío del recordatorio
            </label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)}
              className={inputClass()} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              Horas de espera antes del seguimiento
            </label>
            <div className="flex items-center gap-2">
              <input type="number" value={horasEspera} onChange={(e) => setHorasEspera(e.target.value)}
                min="1" max="24"
                className="w-20 px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
              <span className="text-sm text-ink-600">horas</span>
            </div>
          </div>
        </div>

        {/* Mensaje recordatorio */}
        <div>
          <label className="block text-sm font-medium text-ink-800 mb-1.5">
            Mensaje de recordatorio
          </label>
          <textarea value={mensajeRecordatorio} onChange={(e) => setMensajeRecordatorio(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-y min-h-[120px]"
            placeholder="Usa {nombre} para insertar el nombre del cliente" />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-ink-500">
              Usa <code className="bg-ink-100 px-1 rounded">{"{nombre}"}</code> para el nombre del cliente
            </p>
            <p className="text-xs text-ink-500">{mensajeRecordatorio.length} caracteres</p>
          </div>
          <div className="mt-3 p-3 bg-ink-50 rounded-lg">
            <p className="text-xs text-ink-600 mb-2">Vista previa:</p>
            <PreviewMensaje texto={mensajeRecordatorio} />
          </div>
        </div>

        {/* Mensaje seguimiento */}
        <div>
          <label className="block text-sm font-medium text-ink-800 mb-1.5">
            Mensaje de seguimiento
          </label>
          <textarea value={mensajeFollowup} onChange={(e) => setMensajeFollowup(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-y min-h-[120px]"
            placeholder="Usa {nombre} para insertar el nombre del cliente" />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-ink-500">
              Se envía si no responden después de {horasEspera || "N"} horas
            </p>
            <p className="text-xs text-ink-500">{mensajeFollowup.length} caracteres</p>
          </div>
          <div className="mt-3 p-3 bg-ink-50 rounded-lg">
            <p className="text-xs text-ink-600 mb-2">Vista previa:</p>
            <PreviewMensaje texto={mensajeFollowup} />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={cargando}
            className={buttonClass()}>
            {cargando && <Spinner size="sm" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
