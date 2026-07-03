"use client";

import { useState } from "react";
import ModalRepartidor from "./ModalRepartidor";

interface RutaOpt {
  id: string;
  nombre: string;
}

interface Repartidor {
  id: string;
  nombre: string;
  correo: string;
  activo: boolean;
  rutas_asignadas: RutaOpt[];
}

export default function TablaRepartidores({
  repartidores,
  rutas,
}: {
  repartidores: Repartidor[];
  rutas: RutaOpt[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Repartidor | null>(null);

  const filtrados = repartidores.filter((r) =>
    busqueda ? r.nombre.toLowerCase().includes(busqueda.toLowerCase()) : true
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Repartidores</h1>
            <span className="text-sm text-gray-400 font-medium">{repartidores.length} repartidores</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Cuentas de acceso al mini-dashboard de entregas</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className="h-11 px-3 lg:px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Agregar repartidor</span>
          <span className="sm:hidden">Agregar</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative w-72">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      </div>

      {/* Cards móvil y tablet */}
      <div className="lg:hidden space-y-3">
        {filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
            <p className="text-sm">{busqueda ? "No se encontraron repartidores" : "No hay repartidores registrados"}</p>
          </div>
        ) : (
          filtrados.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                  {r.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.nombre}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${r.activo ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                      {r.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{r.correo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.rutas_asignadas.length > 0
                      ? r.rutas_asignadas.map((ru) => ru.nombre).join(", ")
                      : "Sin rutas asignadas"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => { setEditando(r); setModalAbierto(true); }} className="h-9 px-4 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-brand hover:bg-gray-100 transition-colors">Editar</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Rutas asignadas</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400">
                  <p className="text-sm">{busqueda ? "No se encontraron repartidores" : "No hay repartidores registrados"}</p>
                </td>
              </tr>
            ) : (
              filtrados.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{r.nombre}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{r.correo}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {r.rutas_asignadas.length > 0
                      ? r.rutas_asignadas.map((ru) => ru.nombre).join(", ")
                      : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${r.activo ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.activo ? "bg-green-500" : "bg-red-500"}`} />
                      {r.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => { setEditando(r); setModalAbierto(true); }}
                      className="text-sm text-brand hover:text-brand-light font-medium transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ModalRepartidor
          repartidorInicial={editando}
          rutas={rutas}
          onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
