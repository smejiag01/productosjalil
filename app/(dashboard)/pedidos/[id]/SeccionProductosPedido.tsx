"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatearPrecio } from "@/lib/formato";
import SelectorBusqueda, { type OpcionSelector } from "@/components/SelectorBusqueda";
import { useEdicionPedido } from "./EdicionPedidoContext";

import { Plus, Trash2 } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
interface FilaItem {
  key: string;
  id?: string;
  producto_id: string;
  producto_nombre: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
}

interface ProductoOpt {
  id: string;
  nombre: string;
  unidad: string;
  precio_base: number;
  precio_cliente: number | null;
}

let contadorTemporal = 0;
function nuevaKey(): string {
  contadorTemporal += 1;
  return `nuevo-${contadorTemporal}`;
}

export default function SeccionProductosPedido({
  pedidoId,
  clienteId,
  itemsIniciales,
}: {
  pedidoId: string;
  clienteId: string;
  itemsIniciales: FilaItem[];
}) {
  const router = useRouter();
  const { editando, setEditando } = useEdicionPedido();

  const [filas, setFilas] = useState<FilaItem[]>(itemsIniciales);
  const [productos, setProductos] = useState<ProductoOpt[] | null>(null);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const total = useMemo(
    () => filas.reduce((suma, f) => suma + f.cantidad * f.precio_unitario, 0),
    [filas]
  );

  async function abrirSelectorProductos() {
    setError("");
    if (!productos) {
      setCargandoProductos(true);
      try {
        const res = await fetch(`/api/productos?cliente_id=${clienteId}`);
        const data = await res.json();
        if (data.success) setProductos(data.data);
      } finally {
        setCargandoProductos(false);
      }
    }
    setMostrarSelector(true);
  }

  function agregarProducto(productoId: string) {
    setMostrarSelector(false);
    const producto = productos?.find((p) => p.id === productoId);
    if (!producto) return;

    setFilas((prev) => {
      const existente = prev.find((f) => f.producto_id === productoId);
      if (existente) {
        return prev.map((f) =>
          f.producto_id === productoId ? { ...f, cantidad: f.cantidad + 1 } : f
        );
      }
      return [
        ...prev,
        {
          key: nuevaKey(),
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          unidad: producto.unidad,
          cantidad: 1,
          precio_unitario: producto.precio_cliente ?? producto.precio_base,
        },
      ];
    });
  }

  function cambiarCantidad(key: string, valor: string) {
    const cantidad = parseFloat(valor);
    setFilas((prev) =>
      prev.map((f) => (f.key === key ? { ...f, cantidad: isNaN(cantidad) ? 0 : cantidad } : f))
    );
  }

  function eliminarFila(key: string) {
    setFilas((prev) => prev.filter((f) => f.key !== key));
  }

  function descartar() {
    setFilas(itemsIniciales);
    setError("");
    setEditando(false);
  }

  async function guardar() {
    setError("");

    if (filas.length === 0) {
      setError("Un pedido no puede quedar sin productos. Si quieres eliminarlo, cancela el pedido en su lugar.");
      return;
    }
    if (filas.some((f) => !(f.cantidad > 0))) {
      setError("Todas las cantidades deben ser mayores a 0");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: filas.map((f) => ({ id: f.id, producto_id: f.producto_id, cantidad: f.cantidad })),
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Error al guardar los cambios");
        return;
      }

      const itemsActualizados: FilaItem[] = data.data.items.map((it: {
        id: string;
        producto_id: string;
        producto_nombre: string;
        cantidad: string;
        precio_unitario: string;
        producto: { unidad: string } | null;
      }) => ({
        key: it.id,
        id: it.id,
        producto_id: it.producto_id,
        producto_nombre: it.producto_nombre,
        unidad: it.producto?.unidad ?? "",
        cantidad: Number(it.cantidad),
        precio_unitario: Number(it.precio_unitario),
      }));

      setFilas(itemsActualizados);
      setEditando(false);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  const opcionesSelector: OpcionSelector[] = (productos ?? []).map((p) => ({
    id: p.id,
    titulo: p.nombre,
    subtitulo: formatearPrecio(p.precio_cliente ?? p.precio_base) + (p.precio_cliente != null ? " (precio cliente)" : ""),
  }));

  return (
    <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-ink-100 flex items-center justify-between">
        <h3 className="font-semibold text-ink-900">Productos del pedido</h3>
        {editando ? (
          <button
            onClick={abrirSelectorProductos}
            disabled={cargandoProductos}
            className="h-9 px-3 bg-brand text-white rounded-lg text-xs font-medium hover:bg-brand-light transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus aria-hidden="true" className="w-3.5 h-3.5" />
            {cargandoProductos ? "Cargando..." : "Agregar producto"}
          </button>
        ) : (
          <span className="text-sm text-ink-500">{filas.length} productos</span>
        )}
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{error}</div>
      )}

      {/* Cards móvil */}
      <div className="md:hidden divide-y divide-ink-50">
        {filas.map((item) => (
          <div key={item.key} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-ink-900">{item.producto_nombre}</p>
              {editando && (
                <button onClick={() => eliminarFila(item.key)} className="text-danger hover:text-danger flex-shrink-0">
                  <Trash2 aria-hidden="true" className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex justify-between items-center text-xs text-ink-600">
              {editando ? (
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.cantidad}
                  onChange={(e) => cambiarCantidad(item.key, e.target.value)}
                  className="w-20 px-2 py-1 border border-ink-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              ) : (
                <span>{item.cantidad} {item.unidad}</span>
              )}
              <span>{formatearPrecio(item.precio_unitario)}/{item.unidad}</span>
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-sm font-medium text-ink-900">{formatearPrecio(item.cantidad * item.precio_unitario)}</span>
            </div>
          </div>
        ))}
        <div className="p-4 flex justify-between items-center border-t-2 border-ink-200">
          <span className="text-sm font-medium text-ink-600">Total</span>
          <span className="text-xl font-bold text-brand">{formatearPrecio(total)}</span>
        </div>
      </div>

      {/* Tabla desktop */}
      <table className="w-full hidden md:table">
        <thead>
          <tr className="border-b border-ink-100">
            <th className="text-left py-3 px-6 text-xs font-medium text-ink-600 uppercase tracking-wider">Producto</th>
            <th className="text-left py-3 px-6 text-xs font-medium text-ink-600 uppercase tracking-wider">Cantidad</th>
            <th className="text-right py-3 px-6 text-xs font-medium text-ink-600 uppercase tracking-wider">Precio unitario</th>
            <th className="text-right py-3 px-6 text-xs font-medium text-ink-600 uppercase tracking-wider">Subtotal</th>
            {editando && <th className="text-right py-3 px-6 text-xs font-medium text-ink-600 uppercase tracking-wider"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-50">
          {filas.map((item) => (
            <tr key={item.key}>
              <td className="py-3 px-6"><div className="flex items-center gap-2"><span className="text-ink-500">•</span><span className="text-sm font-medium text-ink-900">{item.producto_nombre}</span></div></td>
              <td className="py-3 px-6 text-sm text-ink-700">
                {editando ? (
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.cantidad}
                    onChange={(e) => cambiarCantidad(item.key, e.target.value)}
                    className="w-20 px-2 py-1 border border-ink-300 rounded text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                ) : (
                  <>{item.cantidad} {item.unidad}</>
                )}
              </td>
              <td className="py-3 px-6 text-sm text-ink-700 text-right">{formatearPrecio(item.precio_unitario)}{item.unidad ? `/${item.unidad}` : ""}</td>
              <td className="py-3 px-6 text-sm font-medium text-ink-900 text-right">{formatearPrecio(item.cantidad * item.precio_unitario)}</td>
              {editando && (
                <td className="py-3 px-6 text-right">
                  <button onClick={() => eliminarFila(item.key)} className="text-danger hover:text-danger">
                    <Trash2 aria-hidden="true" className="w-4 h-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink-200">
            <td colSpan={3} className="py-4 px-6 text-right text-sm font-medium text-ink-600">Total</td>
            <td className="py-4 px-6 text-right text-xl font-bold text-brand">{formatearPrecio(total)}</td>
            {editando && <td />}
          </tr>
        </tfoot>
      </table>

      {editando && (
        <div className="px-4 sm:px-6 py-4 border-t border-ink-100 flex justify-end gap-3">
          <button
            onClick={descartar}
            disabled={guardando}
            className="h-11 px-4 bg-white border border-ink-200 rounded-lg text-sm font-medium text-ink-800 hover:bg-ink-50 transition-colors disabled:opacity-50"
          >
            Descartar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="h-11 px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {guardando && <Spinner size="sm" />}
            Guardar cambios
          </button>
        </div>
      )}

      {mostrarSelector && (
        <SelectorBusqueda
          titulo="Agregar producto"
          placeholder="Buscar producto..."
          opciones={opcionesSelector}
          onSeleccionar={agregarProducto}
          onCerrar={() => setMostrarSelector(false)}
        />
      )}
    </div>
  );
}
