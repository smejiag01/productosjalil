"use client";

import { useState } from "react";
import ModalEmpleado from "./ModalEmpleado";

import { Plus, Search, Users } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/clases";
interface Empleado {
  id: string;
  nombre: string;
  cargo: string | null;
  telefono: string | null;
  activo: boolean;
}

export default function TablaEmpleados({ empleados }: { empleados: Empleado[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Empleado | null>(null);

  const filtrados = empleados.filter((e) =>
    busqueda ? e.nombre.toLowerCase().includes(busqueda.toLowerCase()) : true
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">Empleados</h1>
            <span className="text-sm text-ink-500 font-medium">{empleados.length} empleados</span>
          </div>
          <p className="text-ink-600 text-sm mt-1">Gestión del personal del negocio</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className={buttonClass({ className: "flex-shrink-0" })}
        >
          <Plus aria-hidden="true" className="w-4 h-4" />
          <span className="hidden sm:inline">Agregar empleado</span>
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
            className="pl-9 pr-4 py-2 border border-ink-200 rounded-control text-sm w-full outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      </div>

      {/* Cards móvil y tablet */}
      <div className="lg:hidden space-y-3">
        {filtrados.length === 0 ? (
          <div className="bg-white rounded-card border border-ink-200 shadow-card py-16 text-center text-ink-500">
            <p className="text-sm">{busqueda ? "No se encontraron empleados" : "No hay empleados registrados"}</p>
          </div>
        ) : (
          filtrados.map((e) => (
            <div key={e.id} className="bg-white rounded-card border border-ink-200 shadow-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-ink-100 rounded-full flex items-center justify-center text-sm font-semibold text-ink-700 flex-shrink-0">
                  {e.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink-900 truncate">{e.nombre}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${e.activo ? "bg-ok-soft border-ok/30 text-ok" : "bg-danger-soft border-danger/30 text-danger"}`}>
                      {e.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">{e.cargo || "Sin cargo"}{e.telefono ? ` · ${e.telefono}` : ""}</p>
                </div>
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-ink-100">
                <button onClick={() => { setEditando(e); setModalAbierto(true); }} className="h-9 px-4 bg-ink-50 border border-ink-200 rounded-control text-xs font-medium text-brand hover:bg-ink-100 transition-colors">Editar</button>
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
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Cargo</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Teléfono</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-ink-500">
                  <div className="flex flex-col items-center gap-2">
                    <Users aria-hidden="true" className="w-12 h-12 text-ink-300" />
                    <p className="text-sm">{busqueda ? "No se encontraron empleados" : "No hay empleados registrados"}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtrados.map((e) => (
                <tr key={e.id} className="hover:bg-ink-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-ink-900">{e.nombre}</td>
                  <td className="py-3 px-4 text-sm text-ink-700">{e.cargo || "—"}</td>
                  <td className="py-3 px-4 text-sm text-ink-700">{e.telefono || "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${e.activo ? "bg-ok-soft border-ok/30 text-ok" : "bg-danger-soft border-danger/30 text-danger"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${e.activo ? "bg-ok" : "bg-danger"}`} />
                      {e.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => { setEditando(e); setModalAbierto(true); }}
                      className="text-sm text-brand hover:text-brand-700 font-medium transition-colors"
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
        <ModalEmpleado
          empleadoInicial={editando}
          onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
