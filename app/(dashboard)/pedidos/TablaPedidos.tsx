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
}

interface Props {
  pedidos: PedidoFila[];
  contadores: Record<string, number>;
}

const FILTROS: { key: string; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "en_proceso", label: "En proceso" },
  { key: "confirmado", label: "Confirmados" },
  { key: "cancelado", label: "Cancelados" },
  { key: "entregado", label: "Entregados" },
];

export default function TablaPedidos({ pedidos, contadores }: Props) {
  const [filtro, setFiltro] = useState("todos");

  const pedidosFiltrados =
    filtro === "todos"
      ? pedidos
      : pedidos.filter((p) => p.estado === filtro);

  return (
    <>
      {/* Filtros */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTROS.map((f) => {
          const count = contadores[f.key] ?? 0;
          const activo = filtro === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
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
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruta
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Productos
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pedidosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H2v7l6.29 6.29a1 1 0 0 0 1.42 0l5.58-5.58a1 1 0 0 0 0-1.42L9 5Z" />
                      <path d="M6 9.01V9" />
                    </svg>
                    <p className="text-sm">
                      {filtro === "todos"
                        ? "No hay pedidos para hoy"
                        : `No hay pedidos con estado "${ESTADOS[filtro as EstadoPedido]?.label}"`}
                    </p>
                    <p className="text-xs text-gray-300">
                      Los pedidos aparecerán aquí cuando los clientes los
                      realicen por WhatsApp
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pedidosFiltrados.map((pedido) => (
                <tr
                  key={pedido.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                        {pedido.clienteNombre
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {pedido.clienteNombre}
                        </p>
                        {pedido.clienteCodigo && (
                          <p className="text-xs text-gray-400">
                            {pedido.clienteCodigo}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {pedido.rutaNombre}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {pedido.numProductos} productos
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {pedido.total}
                  </td>
                  <td className="py-3 px-4">
                    <BadgeEstado estado={pedido.estado} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/pedidos/${pedido.id}`}
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
    </>
  );
}
