"use client";

import { useState, useMemo } from "react";

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
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onCerrar}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-gray-900">{titulo}</h3>
          <button onClick={onCerrar} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder={placeholder}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filtradas.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Sin resultados</div>
          ) : (
            filtradas.map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={o.deshabilitada}
                onClick={() => !o.deshabilitada && onSeleccionar(o.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                  o.deshabilitada ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{o.titulo}</p>
                {o.subtitulo && <p className="text-xs text-gray-400 mt-0.5">{o.subtitulo}</p>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
