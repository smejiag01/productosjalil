"use client";

import { useState } from "react";
import Link from "next/link";
import { DIAS_SEMANA } from "@/lib/dias-semana";
import ModalRuta from "./ModalRuta";

import { Plus } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/clases";
import { Route } from "@/components/ui/icons";
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
            <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">Rutas</h1>
            <span className="text-sm text-ink-500">{rutas.length} rutas</span>
          </div>
          <p className="text-ink-600 text-sm mt-1">Gestión de rutas de entrega</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className={buttonClass({ className: "flex-shrink-0" })}
        >
          <Plus aria-hidden="true" className="w-4 h-4" />
          Crear ruta
        </button>
      </div>

      {/* Cards móvil y tablet */}
      <div className="lg:hidden space-y-3">
        {rutas.length === 0 ? (
          <div className="bg-white rounded-card border border-ink-200 shadow-card py-16 text-center text-ink-500">
            <p className="text-sm">No hay rutas creadas</p>
          </div>
        ) : (
          rutas.map((r) => (
            <div key={r.id} className="bg-white rounded-card border border-ink-200 shadow-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{r.nombre}</p>
                  <p className="text-xs text-ink-600 mt-0.5">{r.empleado?.nombre || "Sin repartidor"}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${r.activa ? "bg-ok-soft border-ok/30 text-ok" : "bg-danger-soft border-danger/30 text-danger"}`}>
                  {r.activa ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {r.dias_semana.length > 0 ? r.dias_semana.map((d) => (
                  <span key={d} className="px-2 py-0.5 bg-brand/10 text-brand text-xs font-medium rounded">
                    {DIAS_SEMANA[d]?.substring(0, 3)}
                  </span>
                )) : <span className="text-xs text-ink-500">Sin días asignados</span>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                <span className="text-xs text-ink-600">{r.num_clientes} clientes</span>
                <div className="flex items-center gap-2">
                  <Link href={`/rutas/${r.id}`} className="h-9 px-4 bg-ink-50 border border-ink-200 rounded-lg text-xs font-medium text-brand hover:bg-ink-100 transition-colors flex items-center">Orden de entrega</Link>
                  <button onClick={() => { setEditando(r); setModalAbierto(true); }} className="h-9 px-4 bg-ink-50 border border-ink-200 rounded-lg text-xs font-medium text-brand hover:bg-ink-100 transition-colors">Editar</button>
                </div>
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
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Día de la semana</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Repartidor</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Clientes</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {rutas.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-ink-500">
                  <div className="flex flex-col items-center gap-2">
                    <Route aria-hidden="true" className="w-12 h-12 text-ink-300" />
                    <p className="text-sm">No hay rutas creadas</p>
                    <p className="text-xs text-ink-300">Crea una ruta para organizar las entregas</p>
                  </div>
                </td>
              </tr>
            ) : (
              rutas.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-ink-900">{r.nombre}</p>
                      {r.descripcion && <p className="text-xs text-ink-500 truncate max-w-[200px]">{r.descripcion}</p>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-700">
                    {r.dias_semana.length > 0 ? r.dias_semana.map((d) => DIAS_SEMANA[d]).join(", ") : "Sin asignar"}
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-700">
                    {r.empleado?.nombre || "Sin repartidor"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-ink-100 rounded-full text-sm font-medium text-ink-800">
                      {r.num_clientes}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${r.activa ? "bg-ok-soft border-ok/30 text-ok" : "bg-danger-soft border-danger/30 text-danger"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.activa ? "bg-ok" : "bg-danger"}`} />
                      {r.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/rutas/${r.id}`} className="text-sm text-brand hover:text-brand-light font-medium transition-colors">
                        Orden de entrega
                      </Link>
                      <button
                        onClick={() => { setEditando(r); setModalAbierto(true); }}
                        className="text-sm text-brand hover:text-brand-light font-medium transition-colors"
                      >
                        Editar
                      </button>
                    </div>
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
