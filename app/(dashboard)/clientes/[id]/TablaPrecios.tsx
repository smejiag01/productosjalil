"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatearPrecio } from "@/lib/formato";

import { Check, Pencil, Trash2, X } from "@/components/ui/icons";
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
    <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
        <h3 className="font-semibold text-ink-900">
          Precios personalizados
        </h3>
        <span className="text-sm text-ink-500">
          {productos.filter((p) => p.precio_cliente !== null).length} de{" "}
          {productos.length} personalizados
        </span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-ink-100">
            <th className="text-left py-3 px-6 text-xs font-medium text-ink-600 uppercase">
              Producto
            </th>
            <th className="text-left py-3 px-6 text-xs font-medium text-ink-600 uppercase">
              Unidad
            </th>
            <th className="text-right py-3 px-6 text-xs font-medium text-ink-600 uppercase">
              Precio base
            </th>
            <th className="text-right py-3 px-6 text-xs font-medium text-ink-600 uppercase">
              Precio cliente
            </th>
            <th className="text-right py-3 px-6 text-xs font-medium text-ink-600 uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-50">
          {productos.map((p) => {
            const esEditando = editando === p.id;
            const estaGuardando = guardando === p.id;

            return (
              <tr key={p.id} className="hover:bg-ink-50/50">
                <td className="py-3 px-6 text-sm font-medium text-ink-900">
                  {p.nombre}
                </td>
                <td className="py-3 px-6 text-sm text-ink-600">{p.unidad}</td>
                <td className="py-3 px-6 text-sm text-ink-600 text-right">
                  {formatearPrecio(p.precio_base)}
                </td>
                <td className="py-3 px-6 text-right">
                  {esEditando ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-ink-500">$</span>
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
                        className="p-1 text-ok hover:bg-ok-soft rounded"
                      >
                        <Check aria-hidden="true" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="p-1 text-ink-500 hover:bg-ink-100 rounded"
                      >
                        <X aria-hidden="true" className="w-4 h-4" />
                      </button>
                    </div>
                  ) : p.precio_cliente !== null ? (
                    <span className="text-sm font-medium text-brand">
                      {formatearPrecio(p.precio_cliente)}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-300 italic">
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
                        className="p-1.5 text-ink-500 hover:text-brand hover:bg-ink-100 rounded transition-colors"
                        title="Editar precio"
                      >
                        <Pencil aria-hidden="true" className="w-3.5 h-3.5" />
                      </button>
                      {p.precio_cliente !== null && (
                        <button
                          onClick={() => eliminarPrecio(p.id)}
                          disabled={estaGuardando}
                          className="p-1.5 text-ink-500 hover:text-danger hover:bg-danger-soft rounded transition-colors"
                          title="Usar precio base"
                        >
                          <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
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
