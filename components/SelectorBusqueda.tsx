"use client";

import { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import { Search } from "@/components/ui/icons";
import { inputClass } from "@/components/ui/clases";
import { cn } from "@/lib/cn";

export interface OpcionSelector {
  id: string;
  titulo: string;
  subtitulo?: string;
  deshabilitada?: boolean;
}

interface Props {
  titulo: string;
  placeholder?: string;
  opciones: OpcionSelector[];
  onSeleccionar: (id: string) => void;
  onCerrar: () => void;
}

export default function SelectorBusqueda({
  titulo,
  placeholder = "Buscar...",
  opciones,
  onSeleccionar,
  onCerrar,
}: Props) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return opciones;
    const q = busqueda.toLowerCase();
    return opciones.filter(
      (o) => o.titulo.toLowerCase().includes(q) || o.subtitulo?.toLowerCase().includes(q)
    );
  }, [busqueda, opciones]);

  return (
    <Modal open onClose={onCerrar} title={titulo} size="md">
      <div className="-mx-5 -my-4">
        <div className="border-b border-ink-200 p-4">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
            />
            <input
              data-autofocus
              type="text"
              aria-label={placeholder}
              placeholder={placeholder}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={inputClass({ className: "pl-9" })}
            />
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {filtradas.length === 0 ? (
            <div className="py-10 text-center text-sm text-ink-600">Sin resultados</div>
          ) : (
            filtradas.map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={o.deshabilitada}
                onClick={() => !o.deshabilitada && onSeleccionar(o.id)}
                className={cn(
                  "w-full border-b border-ink-100 px-5 py-3 text-left transition-colors last:border-0",
                  o.deshabilitada ? "cursor-not-allowed opacity-40" : "hover:bg-ink-50"
                )}
              >
                <p className="text-sm font-medium text-ink-900">{o.titulo}</p>
                {o.subtitulo && <p className="mt-0.5 text-xs text-ink-600">{o.subtitulo}</p>}
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
