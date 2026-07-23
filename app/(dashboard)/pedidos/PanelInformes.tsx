"use client";

import { useState } from "react";
import { calcularRango, calcularRangoPersonalizado, fmtShort, hoyStr, type Periodo } from "@/lib/analiticas/periodos";

type Atajo = Exclude<Periodo, "diario"> | "personalizado";

const ATAJOS: { key: Atajo; label: string }[] = [
  { key: "semanal", label: "Semana actual" },
  { key: "quincenal", label: "Quincena actual" },
  { key: "mensual", label: "Mes actual" },
  { key: "personalizado", label: "Personalizado" },
];

export default function PanelInformes() {
  const hoy = hoyStr();
  const [atajo, setAtajo] = useState<Atajo>("semanal");
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);

  const rango =
    atajo === "personalizado" ? calcularRangoPersonalizado(desde, hasta) : calcularRango(atajo, hoy);

  const rangoValido = rango.inicio && rango.fin;
  const urlDescarga = `/api/pedidos/informes?desde=${rango.inicio}&hasta=${rango.fin}`;
  const etiquetaRango =
    rango.inicio === rango.fin ? fmtShort(rango.inicio) : `${fmtShort(rango.inicio)} – ${fmtShort(rango.fin)}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Informe de pedidos por rango</h2>
      <p className="text-sm text-gray-500 mb-4">
        Excel con el detalle de productos por pedido (misma estructura del formato Mekano) más una hoja de
        resumen: total vendido por producto y por cliente en el rango elegido.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {ATAJOS.map((a) => (
          <button
            key={a.key}
            onClick={() => setAtajo(a.key)}
            className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors ${
              atajo === a.key
                ? "bg-brand text-white"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {atajo === "personalizado" && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <span className="text-gray-400 text-sm">a</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900 capitalize">{etiquetaRango}</p>
          <p className="text-xs text-gray-400">Rango seleccionado</p>
        </div>
        <a
          href={rangoValido ? urlDescarga : undefined}
          className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            rangoValido
              ? "bg-brand text-white hover:bg-brand-light"
              : "bg-gray-200 text-gray-400 pointer-events-none"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Descargar informe
        </a>
      </div>
    </div>
  );
}
