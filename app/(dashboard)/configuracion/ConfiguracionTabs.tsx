"use client";

import { useState } from "react";
import SeccionNegocio from "./SeccionNegocio";
import SeccionWhatsApp from "./SeccionWhatsApp";
import SeccionCuenta from "./SeccionCuenta";

interface Config {
  id: string;
  nombre_negocio: string;
  nit: string | null;
  direccion: string | null;
  telefono: string | null;
  hora_recordatorio: string;
  horas_espera_followup: number;
  mensaje_recordatorio: string;
  mensaje_followup: string;
}

const TABS = [
  { key: "negocio", label: "Negocio", icono: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )},
  { key: "whatsapp", label: "Mensajes WhatsApp", icono: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )},
  { key: "cuenta", label: "Mi cuenta", icono: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
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
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">
          Administra los datos del negocio, mensajes y tu cuenta
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-full sm:w-fit overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTabActiva(tab.key)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              tabActiva === tab.key
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 text-sm">
            No se encontró registro de configuración. Contacta al administrador.
          </p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-in z-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
