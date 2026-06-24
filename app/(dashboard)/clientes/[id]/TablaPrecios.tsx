"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatearPrecio } from "@/lib/formato";

interface ProductoPrecio {
  id: string;
  nombre: string;
  unidad: string;
  precio_base: number;
  precio_cliente: number | null;
}

interface Props {
  clienteId: string;
  productos: ProductoPrecio[];
}

export default function TablaPrecios({ clienteId, productos }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [valorEdicion, setValorEdicion] = useState("");
  const [guardando, setGuardando] = useState<string | null>(null);

  async function guardarPrecio(productoId: string) {
    const precio = parseFloat(valorEdicion);
    if (isNaN(precio) || precio <= 0) return;

    setGuardando(productoId);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/precios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto_id: productoId, precio }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      }
    } finally {
      setGuardando(null);
      setEditando(null);
    }
  }

  async function eliminarPrecio(productoId: string) {
    setGuardando(productoId);
    try {
      const res = await fetch(
        `/api/clientes/${clienteId}/precios?producto_id=${productoId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        router.refresh();
      }
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Precios personalizados
        </h3>
        <span className="text-sm text-gray-400">
          {productos.filter((p) => p.precio_cliente !== null).length} de{" "}
          {productos.length} personalizados
        </span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">
              Producto
            </th>
            <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">
              Unidad
            </th>
            <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase">
              Precio base
            </th>
            <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase">
              Precio cliente
            </th>
            <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {productos.map((p) => {
            const esEditando = editando === p.id;
            const estaGuardando = guardando === p.id;

            return (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="py-3 px-6 text-sm font-medium text-gray-900">
                  {p.nombre}
                </td>
                <td className="py-3 px-6 text-sm text-gray-500">{p.unidad}</td>
                <td className="py-3 px-6 text-sm text-gray-500 text-right">
                  {formatearPrecio(p.precio_base)}
                </td>
                <td className="py-3 px-6 text-right">
                  {esEditando ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-400">$</span>
                      <input
                        type="number"
                        value={valorEdicion}
                        onChange={(e) => setValorEdicion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") guardarPrecio(p.id);
                          if (e.key === "Escape") setEditando(null);
                        }}
                        autoFocus
                        className="w-28 px-2 py-1 border border-brand rounded text-sm text-right outline-none focus:ring-2 focus:ring-brand/20"
                      />
                      <button
                        onClick={() => guardarPrecio(p.id)}
                        disabled={estaGuardando}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ) : p.precio_cliente !== null ? (
                    <span className="text-sm font-medium text-brand">
                      {formatearPrecio(p.precio_cliente)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300 italic">
                      Usa precio base
                    </span>
                  )}
                </td>
                <td className="py-3 px-6 text-right">
                  {!esEditando && (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditando(p.id);
                          setValorEdicion(
                            p.precio_cliente?.toString() ??
                              p.precio_base.toString()
                          );
                        }}
                        className="p-1.5 text-gray-400 hover:text-brand hover:bg-gray-100 rounded transition-colors"
                        title="Editar precio"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>
                      {p.precio_cliente !== null && (
                        <button
                          onClick={() => eliminarPrecio(p.id)}
                          disabled={estaGuardando}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Usar precio base"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
