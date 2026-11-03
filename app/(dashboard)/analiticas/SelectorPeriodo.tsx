"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Periodo } from "@/lib/analiticas/periodos";
import { periodoAnteriorFecha, periodoSiguienteFecha } from "@/lib/analiticas/periodos";

import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
interface Props {
  periodo: Periodo;
  fecha: string;
  navLabel: string;
  tab: string;
  esPersonalizado: boolean;
  desde: string;
  hasta: string;
}

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "diario",    label: "Diario" },
  { value: "semanal",   label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual",   label: "Mensual" },
];

export default function SelectorPeriodo({ periodo, fecha, navLabel, tab, esPersonalizado, desde, hasta }: Props) {
  const router = useRouter();
  const [desdeInput, setDesdeInput] = useState(desde);
  const [hastaInput, setHastaInput] = useState(hasta);

  function navegar(nuevoPeriodo: Periodo, nuevaFecha: string) {
    const params = new URLSearchParams({ periodo: nuevoPeriodo, fecha: nuevaFecha, tab });
    router.push(`/analiticas?${params.toString()}`);
  }

  function activarPersonalizado() {
    const params = new URLSearchParams({ periodo: "personalizado", desde, hasta, tab });
    router.push(`/analiticas?${params.toString()}`);
  }

  function aplicarPersonalizado() {
    if (!desdeInput || !hastaInput) return;
    const params = new URLSearchParams({ periodo: "personalizado", desde: desdeInput, hasta: hastaInput, tab });
    router.push(`/analiticas?${params.toString()}`);
  }

  const anterior = periodoAnteriorFecha(periodo, fecha);
  const siguiente = periodoSiguienteFecha(periodo, fecha);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      {/* Selector de periodo */}
      <div className="flex bg-ink-100 rounded-control p-0.5 flex-wrap w-fit">
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            onClick={() => navegar(p.value, fecha)}
            className={`px-3 py-1.5 rounded-control text-sm font-medium transition-colors ${
              !esPersonalizado && periodo === p.value
                ? "bg-white shadow-sm text-ink-900"
                : "text-ink-600 hover:text-ink-800"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={activarPersonalizado}
          className={`px-3 py-1.5 rounded-control text-sm font-medium transition-colors whitespace-nowrap ${
            esPersonalizado
              ? "bg-white shadow-sm text-ink-900"
              : "text-ink-600 hover:text-ink-800"
          }`}
        >
          Personalizado
        </button>
      </div>

      {!esPersonalizado ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navegar(periodo, anterior)}
            className="h-9 w-9 flex items-center justify-center rounded-control border border-ink-200 bg-white hover:bg-ink-50 transition-colors"
            title="Periodo anterior"
          >
            <ChevronLeft aria-hidden="true" className="w-4 h-4 text-ink-700" />
          </button>
          <span className="text-sm text-ink-800 font-medium min-w-0 truncate max-w-[200px] sm:max-w-xs first-letter:uppercase">
            {navLabel}
          </span>
          <button
            onClick={() => navegar(periodo, siguiente)}
            className="h-9 w-9 flex items-center justify-center rounded-control border border-ink-200 bg-white hover:bg-ink-50 transition-colors"
            title="Periodo siguiente"
          >
            <ChevronRight aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={desdeInput}
            onChange={(e) => setDesdeInput(e.target.value)}
            className="h-9 px-3 border border-ink-200 rounded-control text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <span className="text-ink-500 text-sm">a</span>
          <input
            type="date"
            value={hastaInput}
            onChange={(e) => setHastaInput(e.target.value)}
            className="h-9 px-3 border border-ink-200 rounded-control text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <button
            onClick={aplicarPersonalizado}
            className="h-9 px-4 bg-brand text-white rounded-control text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
