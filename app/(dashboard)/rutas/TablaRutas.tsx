"use client";

import { useState } from "react";
import { DIAS_SEMANA } from "@/lib/dias-semana";
import ModalRuta from "./ModalRuta";

interface Ruta {
  id: string;
  nombre: string;
  descripcion: string | null;
  dias_semana: number[];
  empleado: { id: string; nombre: string } | null;
  activa: boolean;
  num_clientes: number;
}

interface Empleado {
  id: string;
  nombre: string;
}

interface Props {
  rutas: Ruta[];
  empleados: Empleado[];
}

export default function TablaRutas({ rutas, empleados }: Props) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Ruta | null>(null);

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Rutas</h1>
            <span className="text-sm text-gray-400">{rutas.length} rutas</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Gestión de rutas de entrega</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className="h-11 px-3 lg:px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Crear ruta
        </button>
      </div>

      {/* Cards móvil y tablet */}
      <div className="lg:hidden space-y-3">
        {rutas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
            <p className="text-sm">No hay rutas creadas</p>
          </div>
        ) : (
          rutas.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{r.nombre}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.empleado?.nombre || "Sin repartidor"}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${r.activa ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                  {r.activa ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {r.dias_semana.length > 0 ? r.dias_semana.map((d) => (
                  <span key={d} className="px-2 py-0.5 bg-brand/10 text-brand text-xs font-medium rounded">
                    {DIAS_SEMANA[d]?.substring(0, 3)}
                  </span>
                )) : <span className="text-xs text-gray-400">Sin días asignados</span>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{r.num_clientes} clientes</span>
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
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Día de la semana</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Repartidor</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Clientes</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rutas.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" />
                    </svg>
                    <p className="text-sm">No hay rutas creadas</p>
                    <p className="text-xs text-gray-300">Crea una ruta para organizar las entregas</p>
                  </div>
                </td>
              </tr>
            ) : (
              rutas.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.nombre}</p>
                      {r.descripcion && <p className="text-xs text-gray-400 truncate max-w-[200px]">{r.descripcion}</p>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {r.dias_semana.length > 0 ? r.dias_semana.map((d) => DIAS_SEMANA[d]).join(", ") : "Sin asignar"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {r.empleado?.nombre || "Sin repartidor"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                      {r.num_clientes}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${r.activa ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.activa ? "bg-green-500" : "bg-red-500"}`} />
                      {r.activa ? "Activa" : "Inactiva"}
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
        <ModalRuta
          rutaInicial={editando}
          empleados={empleados}
          onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
