"use client";

import { useState } from "react";
import Link from "next/link";
import ModalCliente from "./ModalCliente";

interface ClienteFila {
  id: string;
  codigo_mekano: string | null;
  nombre: string;
  telefono: string;
  direccion: string | null;
  rutaNombre: string | null;
  ruta_id: string | null;
  activo: boolean;
}

interface Ruta {
  id: string;
  nombre: string;
}

interface Props {
  clientes: ClienteFila[];
  rutas: Ruta[];
  contadores: { todos: number; activos: number; inactivos: number };
}

const FILTROS_ESTADO = [
  { key: "todos", label: "Todos" },
  { key: "activos", label: "Activos" },
  { key: "inactivos", label: "Inactivos" },
];

export default function TablaClientes({
  clientes,
  rutas,
  contadores,
}: Props) {
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroRuta, setFiltroRuta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);

  const clientesFiltrados = clientes.filter((c) => {
    if (filtroEstado === "activos" && !c.activo) return false;
    if (filtroEstado === "inactivos" && c.activo) return false;
    if (filtroRuta && c.ruta_id !== filtroRuta) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        (c.codigo_mekano?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <span className="text-sm text-gray-400 font-medium">
              {contadores.todos} clientes
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Gestión de clientes y precios personalizados
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar cliente
        </button>
      </div>

      {/* Filtros + buscador */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTROS_ESTADO.map((f) => {
            const count = contadores[f.key as keyof typeof contadores] ?? 0;
            const activo = filtroEstado === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFiltroEstado(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activo
                    ? "bg-brand text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activo
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
          {rutas.length > 0 && (
            <select
              value={filtroRuta}
              onChange={(e) => setFiltroRuta(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 outline-none"
            >
              <option value="">Todas las rutas</option>
              {rutas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, código o tel..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-72 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                WhatsApp
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dirección
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruta asignada
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <p className="text-sm">
                      {busqueda
                        ? "No se encontraron clientes con esa búsqueda"
                        : "No hay clientes registrados"}
                    </p>
                    <p className="text-xs text-gray-300">
                      {busqueda
                        ? "Prueba con otro término de búsqueda"
                        : "Agrega tu primer cliente para empezar"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    {c.codigo_mekano ? (
                      <span className="text-sm font-mono text-gray-700">
                        {c.codigo_mekano}
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                        Sin código
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {c.nombre}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {c.telefono}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 max-w-[200px] truncate">
                    {c.direccion || "—"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {c.rutaNombre || "Sin ruta"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        c.activo
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.activo ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="text-sm text-brand hover:text-brand-light font-medium transition-colors"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ModalCliente
          rutas={rutas}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}
