"use client";

import { useState } from "react";
import ModalEmpleado from "./ModalEmpleado";

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
            <span className="text-sm text-gray-400 font-medium">{empleados.length} empleados</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Gestión del personal del negocio</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar empleado
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                    <p className="text-sm">{busqueda ? "No se encontraron empleados" : "No hay empleados registrados"}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtrados.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{e.nombre}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{e.cargo || "—"}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{e.telefono || "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${e.activo ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${e.activo ? "bg-green-500" : "bg-red-500"}`} />
                      {e.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => { setEditando(e); setModalAbierto(true); }}
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
        <ModalEmpleado
          empleadoInicial={editando}
          onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
