"use client";

import { useState } from "react";
import { calcularRango, calcularRangoPersonalizado, fmtShort, hoyStr, type Periodo } from "@/lib/analiticas/periodos";

import { Download } from "@/components/ui/icons";
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
    <div className="bg-white rounded-card border border-ink-200 shadow-card p-6">
      <h2 className="text-base font-semibold text-ink-900 mb-1">Informe de pedidos por rango</h2>
      <p className="text-sm text-ink-600 mb-4">
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
                : "bg-ink-50 border border-ink-200 text-ink-700 hover:bg-ink-100"
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
            className="h-10 px-3 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <span className="text-ink-500 text-sm">a</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="h-10 px-3 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 bg-ink-50 border border-ink-100 rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-medium text-ink-900 capitalize">{etiquetaRango}</p>
          <p className="text-xs text-ink-500">Rango seleccionado</p>
        </div>
        <a
          href={rangoValido ? urlDescarga : undefined}
          className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            rangoValido
              ? "bg-brand text-white hover:bg-brand-light"
              : "bg-ink-200 text-ink-500 pointer-events-none"
          }`}
        >
          <Download aria-hidden="true" className="w-4 h-4" />
          Descargar informe
        </a>
      </div>
    </div>
  );
}
