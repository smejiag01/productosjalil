"use client";

import { useState } from "react";
import Link from "next/link";
import BadgeEstado from "@/components/BadgeEstado";
import { ESTADOS, type EstadoPedido } from "@/lib/pedidos";

interface PedidoFila {
  id: string;
  clienteNombre: string;
  clienteCodigo: string | null;
  rutaNombre: string;
  numProductos: number;
  total: string;
  estado: EstadoPedido;
  fechaPedido?: string;
  creadoEn?: string;
}

const FILTROS: { key: string; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "en_proceso", label: "En proceso" },
  { key: "confirmado", label: "Confirmados" },
  { key: "cancelado", label: "Cancelados" },
  { key: "entregado", label: "Entregados" },
];

export default function TablaPedidos({
  pedidos,
  contadores,
  vistaActual,
}: {
  pedidos: PedidoFila[];
  contadores: Record<string, number>;
  vistaActual: string;
}) {
  const [filtro, setFiltro] = useState("todos");
  const pedidosFiltrados =
    filtro === "todos" ? pedidos : pedidos.filter((p) => p.estado === filtro);

  const mostrarFecha = vistaActual === "todos";

  const estadoVacio = (
    <div className="py-16 text-center text-gray-400">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H2v7l6.29 6.29a1 1 0 0 0 1.42 0l5.58-5.58a1 1 0 0 0 0-1.42L9 5Z" /><path d="M6 9.01V9" />
      </svg>
      <p className="text-sm">
        {filtro === "todos"
          ? "No hay pedidos"
          : `No hay pedidos "${ESTADOS[filtro as EstadoPedido]?.label}"`}
      </p>
      <p className="text-xs text-gray-300 mt-1">Los pedidos aparecerán aquí cuando los clientes los realicen por WhatsApp</p>
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
                activo
                  ? "bg-brand text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
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
        {pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200">{estadoVacio}</div>
        ) : (
          pedidosFiltrados.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                    {p.clienteNombre.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.clienteNombre}</p>
                    <p className="text-xs text-gray-400">
                      {p.rutaNombre} · {p.numProductos} productos
                      {mostrarFecha && p.fechaPedido && <span> · {p.fechaPedido}</span>}
                    </p>
                  </div>
                </div>
                <BadgeEstado estado={p.estado} />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-lg font-bold text-gray-900">{p.total}</span>
                <Link
                  href={`/pedidos/${p.id}`}
                  className="h-10 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-brand hover:bg-gray-100 transition-colors flex items-center"
                >
                  Ver detalle
                </Link>
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
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              {mostrarFecha && (
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              )}
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pedidosFiltrados.length === 0 ? (
              <tr><td colSpan={mostrarFecha ? 7 : 6}>{estadoVacio}</td></tr>
            ) : (
              pedidosFiltrados.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                        {p.clienteNombre.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.clienteNombre}</p>
                        {p.clienteCodigo && <p className="text-xs text-gray-400">{p.clienteCodigo}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.rutaNombre}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.numProductos} productos</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{p.total}</td>
                  <td className="py-3 px-4"><BadgeEstado estado={p.estado} /></td>
                  {mostrarFecha && (
                    <td className="py-3 px-4 text-sm text-gray-500">{p.creadoEn}</td>
                  )}
                  <td className="py-3 px-4 text-right">
                    <Link href={`/pedidos/${p.id}`} className="text-sm text-brand hover:text-brand-light font-medium">Ver detalle</Link>
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
