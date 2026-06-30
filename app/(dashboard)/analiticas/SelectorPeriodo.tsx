"use client";

import { useRouter } from "next/navigation";
import type { Periodo } from "@/lib/analiticas/periodos";
import { periodoAnteriorFecha, periodoSiguienteFecha } from "@/lib/analiticas/periodos";

interface Props {
  periodo: Periodo;
  fecha: string;
  navLabel: string;
  tab: string;
}

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "diario",    label: "Diario" },
  { value: "semanal",   label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual",   label: "Mensual" },
];

export default function SelectorPeriodo({ periodo, fecha, navLabel, tab }: Props) {
  const router = useRouter();

  function navegar(nuevoPeriodo: Periodo, nuevaFecha: string) {
    const params = new URLSearchParams({ periodo: nuevoPeriodo, fecha: nuevaFecha, tab });
    router.push(`/analiticas?${params.toString()}`);
  }

  const anterior = periodoAnteriorFecha(periodo, fecha);
  const siguiente = periodoSiguienteFecha(periodo, fecha);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      {/* Selector de periodo */}
      <div className="flex bg-gray-100 rounded-lg p-0.5">
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            onClick={() => navegar(p.value, fecha)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              periodo === p.value
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Navegación prev / label / next */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navegar(periodo, anterior)}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          title="Periodo anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-sm text-gray-700 font-medium min-w-0 truncate max-w-[200px] sm:max-w-xs capitalize">
          {navLabel}
        </span>
        <button
          onClick={() => navegar(periodo, siguiente)}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          title="Periodo siguiente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
