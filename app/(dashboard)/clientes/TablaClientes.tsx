"use client";

import { useState } from "react";
import Link from "next/link";
import ModalCliente from "./ModalCliente";

import { Phone, Plus, Search, Users, MapPin } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/clases";
interface ClienteFila {
  id: string;
  nit: string | null;
  nombre: string;
  telefono: string;
  direccion: string | null;
  rutaNombre: string | null;
  ruta_id: string | null;
  activo: boolean;
  numContactos: number;
  contactosSinVerificar: number;
}

interface Ruta {
  id: string;
  nombre: string;
}

interface Props {
  clientes: ClienteFila[];
  rutas: Ruta[];
  contadores: { todos: number; activos: number; inactivos: number };
  sinRutaInicial?: boolean;
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
  sinRutaInicial = false,
}: Props) {
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroRuta, setFiltroRuta] = useState("");
  const [soloSinRuta, setSoloSinRuta] = useState(sinRutaInicial);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);

  // Solo cuentan los clientes ACTIVOS: uno archivado sin ruta no necesita atención.
  const contadorSinRuta = clientes.filter((c) => c.activo && !c.ruta_id).length;

  const clientesFiltrados = clientes.filter((c) => {
    if (filtroEstado === "activos" && !c.activo) return false;
    if (filtroEstado === "inactivos" && c.activo) return false;
    if (soloSinRuta && (c.ruta_id || !c.activo)) return false;
    if (!soloSinRuta && filtroRuta && c.ruta_id !== filtroRuta) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        (c.nit?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">Clientes</h1>
            <span className="text-sm text-ink-500">{contadores.todos} clientes</span>
          </div>
          <p className="text-ink-600 text-sm mt-1">
            Gestión de clientes y precios personalizados
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className={buttonClass({ className: "flex-shrink-0" })}
        >
          <Plus aria-hidden="true" className="w-4 h-4" />
          Agregar cliente
        </button>
      </div>

      {/* Aviso dinámico: clientes activos sin ruta */}
      {contadorSinRuta > 0 && (
        <div className="mb-6 bg-warn-soft border border-warn/60 rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-warn-soft-text" />
            <div>
              <p className="text-sm font-semibold text-ink-900">
                {contadorSinRuta === 1
                  ? "Hay 1 cliente activo sin ruta asignada"
                  : `Hay ${contadorSinRuta} clientes activos sin ruta asignada`}
              </p>
              <p className="text-xs text-ink-700 mt-0.5">
                {soloSinRuta
                  ? "Abre cada cliente y usa \"Editar cliente\" para asignarle una ruta."
                  : "No reciben recordatorios de WhatsApp ni pueden hacer pedidos en la tienda en línea hasta que les asignes una ruta."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSoloSinRuta((v) => !v)}
            className="px-4 py-2 bg-warn text-ink-900 rounded-control text-sm font-semibold hover:bg-accent transition-colors whitespace-nowrap flex-shrink-0"
          >
            {soloSinRuta ? "Ver todos los clientes" : "Ver y asignar"}
          </button>
        </div>
      )}

      {/* Filtros + buscador */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                    : "bg-white border border-ink-200 text-ink-700 hover:bg-ink-50"
                }`}
              >
                {f.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activo
                      ? "bg-white/20 text-white"
                      : "bg-ink-100 text-ink-600"
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
              disabled={soloSinRuta}
              onChange={(e) => setFiltroRuta(e.target.value)}
              className="px-3 py-2 bg-white border border-ink-200 rounded-full text-sm text-ink-700 outline-none disabled:opacity-50"
            >
              <option value="">Todas las rutas</option>
              {rutas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setSoloSinRuta((v) => !v)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              soloSinRuta
                ? "bg-warn text-ink-900"
                : "bg-warn-soft border border-warn/30 text-warn-soft-text hover:bg-warn-soft"
            }`}
          >
            Sin ruta asignada
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                soloSinRuta ? "bg-white/20 text-white" : "bg-warn-soft text-warn-soft-text"
              }`}
            >
              {contadorSinRuta}
            </span>
          </button>
        </div>
        <div className="relative">
          <Search aria-hidden="true" className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, NIT o tel..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 border border-ink-200 rounded-control text-sm w-full sm:w-72 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      </div>

      {/* Tabla */}
      {/* Cards móvil y tablet */}
      <div className="lg:hidden space-y-3">
        {clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-card border border-ink-200 shadow-card py-16 text-center text-ink-500">
            <p className="text-sm">{busqueda ? "No se encontraron clientes" : "No hay clientes registrados"}</p>
          </div>
        ) : (
          clientesFiltrados.map((c) => (
            <div key={c.id} className="bg-white rounded-card border border-ink-200 shadow-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{c.nombre}</p>
                  <p className="text-xs text-ink-500">{c.nit || "Sin NIT"} · {c.rutaNombre || "Sin ruta"}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${c.activo ? "bg-ok-soft border-ok/30 text-ok" : "bg-danger-soft border-danger/30 text-danger"}`}>
                  {c.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-600 mt-2">
                <Phone aria-hidden="true" className="w-3.5 h-3.5 text-ok flex-shrink-0" />
                <span>{c.telefono}</span>
                <span className="text-ink-300">·</span>
                <span>{c.numContactos} contacto{c.numContactos === 1 ? "" : "s"}</span>
                {c.contactosSinVerificar > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-warn-soft text-warn-soft-text font-medium">
                    {c.contactosSinVerificar} sin verificar
                  </span>
                )}
              </div>
              <Link
                href={`/clientes/${c.id}`}
                className="mt-3 h-10 w-full bg-ink-50 border border-ink-200 rounded-control text-sm font-medium text-brand hover:bg-ink-100 transition-colors flex items-center justify-center"
              >
                Ver detalle
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                NIT / Documento
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                WhatsApp
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Dirección
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Ruta asignada
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Contactos
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-ink-500">
                  <div className="flex flex-col items-center gap-2">
                    <Users aria-hidden="true" className="w-12 h-12 text-ink-300" />
                    <p className="text-sm">
                      {busqueda
                        ? "No se encontraron clientes con esa búsqueda"
                        : "No hay clientes registrados"}
                    </p>
                    <p className="text-xs text-ink-300">
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
                  className={`hover:bg-ink-50/50 transition-colors ${c.contactosSinVerificar > 0 ? "bg-warn-soft/60" : ""}`}
                >
                  <td className="py-3 px-4">
                    {c.nit ? (
                      <span className="text-sm font-mono text-ink-800">
                        {c.nit}
                      </span>
                    ) : (
                      <span className="text-xs text-warn-soft-text bg-warn-soft px-2 py-0.5 rounded">
                        Sin NIT
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-ink-900">
                    {c.nombre}
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-700">
                    {c.telefono}
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-600 max-w-[200px] truncate">
                    {c.direccion || "—"}
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-700">
                    {c.rutaNombre || "Sin ruta"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-ink-700">{c.numContactos}</span>
                      {c.contactosSinVerificar > 0 && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full bg-warn-soft text-warn-soft-text font-medium whitespace-nowrap"
                          title="Tiene contactos sin verificar"
                        >
                          {c.contactosSinVerificar} sin verificar
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        c.activo
                          ? "bg-ok-soft border-ok/30 text-ok"
                          : "bg-danger-soft border-danger/30 text-danger"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.activo ? "bg-ok" : "bg-danger"
                        }`}
                      />
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="text-sm text-brand hover:text-brand-700 font-medium transition-colors"
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
