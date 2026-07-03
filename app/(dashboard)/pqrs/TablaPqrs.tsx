"use client";

import { useState } from "react";
import Link from "next/link";
import BadgeEstadoPqr from "@/components/BadgeEstadoPqr";
import { ESTADOS_PQR, type EstadoPqr } from "@/lib/pqrs";

interface PqrFila {
  id: string;
  clienteNombre: string;
  telefono: string;
  texto: string | null;
  estado: string;
  fecha: string;
  hora: string;
  numAdjuntos: number;
}

const FILTROS: { key: string; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "en_revision", label: "En revisión" },
  { key: "resuelto", label: "Resueltos" },
];

export default function TablaPqrs({
  pqrs,
  contadores,
}: {
  pqrs: PqrFila[];
  contadores: Record<string, number>;
}) {
  const [filtro, setFiltro] = useState("todos");
  const pqrsFiltrados = filtro === "todos" ? pqrs : pqrs.filter((p) => p.estado === filtro);

  const estadoVacio = (
    <div className="py-16 text-center text-gray-400">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <p className="text-sm">
        {filtro === "todos"
          ? "No hay PQR's"
          : `No hay PQR's "${ESTADOS_PQR[filtro as EstadoPqr]?.label}"`}
      </p>
      <p className="text-xs text-gray-300 mt-1">Aparecerán aquí cuando los clientes escriban por WhatsApp</p>
    </div>
  );

  return (
    <>
      {/* Filtros por estado */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        {FILTROS.map((f) => {
          const count = contadores[f.key] ?? 0;
          const activo = filtro === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`h-10 px-3 lg:px-4 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                activo ? "bg-brand text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activo ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards móvil/tablet */}
      <div className="lg:hidden space-y-3">
        {pqrsFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200">{estadoVacio}</div>
        ) : (
          pqrsFiltrados.map((p) => (
            <Link
              key={p.id}
              href={`/pqrs/${p.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.clienteNombre}</p>
                  <p className="text-xs text-gray-400">{p.telefono} · {p.fecha}</p>
                </div>
                <BadgeEstadoPqr estado={p.estado} />
              </div>
              {p.texto && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{p.texto}</p>}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {p.numAdjuntos > 0 ? `${p.numAdjuntos} adjunto${p.numAdjuntos > 1 ? "s" : ""}` : "Sin adjuntos"}
                </span>
                <span className="text-sm text-brand font-medium">Ver detalle</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pqrsFiltrados.length === 0 ? (
              <tr><td colSpan={5}>{estadoVacio}</td></tr>
            ) : (
              pqrsFiltrados.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                        {p.clienteNombre.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{p.clienteNombre}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.telefono}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{p.fecha} · {p.hora}</td>
                  <td className="py-3 px-4"><BadgeEstadoPqr estado={p.estado} /></td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/pqrs/${p.id}`} className="text-sm text-brand hover:text-brand-light font-medium">Ver detalle</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
