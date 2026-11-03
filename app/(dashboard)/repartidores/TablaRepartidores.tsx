"use client";

import { useState } from "react";
import ModalRepartidor from "./ModalRepartidor";

import { Plus, Search } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/clases";
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
            <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">Repartidores</h1>
            <span className="text-sm text-ink-500 font-medium">{repartidores.length} repartidores</span>
          </div>
          <p className="text-ink-600 text-sm mt-1">Cuentas de acceso al mini-dashboard de entregas</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className={buttonClass({ className: "flex-shrink-0" })}
        >
          <Plus aria-hidden="true" className="w-4 h-4" />
          <span className="hidden sm:inline">Agregar repartidor</span>
          <span className="sm:hidden">Agregar</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative w-72">
          <Search aria-hidden="true" className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 border border-ink-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      </div>

      {/* Cards móvil y tablet */}
      <div className="lg:hidden space-y-3">
        {filtrados.length === 0 ? (
          <div className="bg-white rounded-card border border-ink-200 shadow-card py-16 text-center text-ink-500">
            <p className="text-sm">{busqueda ? "No se encontraron repartidores" : "No hay repartidores registrados"}</p>
          </div>
        ) : (
          filtrados.map((r) => (
            <div key={r.id} className="bg-white rounded-card border border-ink-200 shadow-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-ink-100 rounded-full flex items-center justify-center text-sm font-semibold text-ink-700 flex-shrink-0">
                  {r.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink-900 truncate">{r.nombre}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${r.activo ? "bg-ok-soft border-ok/30 text-ok" : "bg-danger-soft border-danger/30 text-danger"}`}>
                      {r.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">{r.correo}</p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {r.rutas_asignadas.length > 0
                      ? r.rutas_asignadas.map((ru) => ru.nombre).join(", ")
                      : "Sin rutas asignadas"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-ink-100">
                <button onClick={() => { setEditando(r); setModalAbierto(true); }} className="h-9 px-4 bg-ink-50 border border-ink-200 rounded-lg text-xs font-medium text-brand hover:bg-ink-100 transition-colors">Editar</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Nombre</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Correo</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Rutas asignadas</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-ink-500">
                  <p className="text-sm">{busqueda ? "No se encontraron repartidores" : "No hay repartidores registrados"}</p>
                </td>
              </tr>
            ) : (
              filtrados.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-ink-900">{r.nombre}</td>
                  <td className="py-3 px-4 text-sm text-ink-700">{r.correo}</td>
                  <td className="py-3 px-4 text-sm text-ink-700">
                    {r.rutas_asignadas.length > 0
                      ? r.rutas_asignadas.map((ru) => ru.nombre).join(", ")
                      : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${r.activo ? "bg-ok-soft border-ok/30 text-ok" : "bg-danger-soft border-danger/30 text-danger"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.activo ? "bg-ok" : "bg-danger"}`} />
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
