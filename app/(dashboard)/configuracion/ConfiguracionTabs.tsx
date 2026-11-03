"use client";

import { useState } from "react";
import SeccionNegocio from "./SeccionNegocio";
import SeccionWhatsApp from "./SeccionWhatsApp";
import SeccionCuenta from "./SeccionCuenta";

import { Check } from "@/components/ui/icons";
import { House, MessageSquareText, UserRound } from "@/components/ui/icons";
interface Config {
  id: string;
  nombre_negocio: string;
  nit: string | null;
  direccion: string | null;
  telefono: string | null;
  whatsapp_atencion: string | null;
  hora_recordatorio: string;
  horas_espera_followup: number;
  mensaje_recordatorio: string;
  mensaje_followup: string;
}

const TABS = [
  { key: "negocio", label: "Negocio", icono: (
    <House aria-hidden="true" className="w-4 h-4" />
  )},
  { key: "whatsapp", label: "Mensajes WhatsApp", icono: (
    <MessageSquareText aria-hidden="true" className="w-4 h-4" />
  )},
  { key: "cuenta", label: "Mi cuenta", icono: (
    <UserRound aria-hidden="true" className="w-4 h-4" />
  )},
];

export default function ConfiguracionTabs({
  config,
  correoUsuario,
}: {
  config: Config | null;
  correoUsuario: string;
}) {
  const [tabActiva, setTabActiva] = useState("negocio");
  const [toast, setToast] = useState<string | null>(null);

  function mostrarToast(mensaje: string) {
    setToast(mensaje);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Configuración</h1>
        <p className="text-ink-600 text-sm mt-1">
          Administra los datos del negocio, mensajes y tu cuenta
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ink-100 rounded-control p-1 mb-6 w-full sm:w-fit overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTabActiva(tab.key)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-control text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              tabActiva === tab.key
                ? "bg-white shadow-sm text-ink-900"
                : "text-ink-600 hover:text-ink-800"
            }`}
          >
            {tab.icono}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tabActiva === "negocio" && config && (
        <SeccionNegocio config={config} onGuardado={mostrarToast} />
      )}
      {tabActiva === "whatsapp" && config && (
        <SeccionWhatsApp config={config} onGuardado={mostrarToast} />
      )}
      {tabActiva === "cuenta" && (
        <SeccionCuenta correoActual={correoUsuario} onGuardado={mostrarToast} />
      )}

      {!config && tabActiva !== "cuenta" && (
        <div className="bg-warn-soft border border-warn/30 rounded-card p-6 text-center">
          <p className="text-warn-soft-text text-sm">
            No se encontró registro de configuración. Contacta al administrador.
          </p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-ink-900 text-white px-4 py-3 rounded-control shadow-lg text-sm flex items-center gap-2 animate-in z-50">
          <Check aria-hidden="true" className="w-4 h-4 text-ok" />
          {toast}
        </div>
      )}
    </div>
  );
}
