"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BadgeEstado from "@/components/BadgeEstado";
import { ESTADOS, ESTADO_ANTERIOR, type EstadoPedido } from "@/lib/pedidos";

import { AlertCircle, CornerUpLeft, Tag } from "@/components/ui/icons";
interface PedidoFila {
  id: string;
  clienteNombre: string;
  clienteCodigo: string | null;
  rutaNombre: string;
  numProductos: number;
  total: string;
  estado: EstadoPedido;
  fechaPedido?: string;
  fechaEntrega?: string;
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

// Botón único con la siguiente acción según el estado actual. Entregado y
// cancelado no tienen acción rápida aquí — ya cerraron su ciclo.
const SIGUIENTE_ACCION: Partial<Record<EstadoPedido, { estado: EstadoPedido; label: string }>> = {
  pendiente: { estado: "en_proceso", label: "Procesar" },
  en_proceso: { estado: "confirmado", label: "Confirmar" },
  confirmado: { estado: "entregado", label: "Entregar" },
};

function IconoDeshacer() {
  return (
    <CornerUpLeft aria-hidden="true" className="w-4 h-4" />
  );
}

function ControlEstado({
  pedido,
  cargando,
  onCambiarEstado,
}: {
  pedido: PedidoFila;
  cargando: boolean;
  onCambiarEstado: (id: string, estadoActual: EstadoPedido, estadoNuevo: EstadoPedido) => void;
}) {
  const siguiente = SIGUIENTE_ACCION[pedido.estado];
  const anterior = ESTADO_ANTERIOR[pedido.estado];

  if (!siguiente && !anterior) return null;

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {anterior && (
        <button
          onClick={() => onCambiarEstado(pedido.id, pedido.estado, anterior)}
          disabled={cargando}
          title={`Volver a "${ESTADOS[anterior].label}"`}
          className="h-8 w-8 flex items-center justify-center rounded-control border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-50 flex-shrink-0"
        >
          <IconoDeshacer />
        </button>
      )}
      {siguiente && (
        <button
          onClick={() => onCambiarEstado(pedido.id, pedido.estado, siguiente.estado)}
          disabled={cargando}
          className="h-8 px-3 rounded-control text-xs font-medium bg-brand text-white hover:bg-brand-700 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
        >
          {siguiente.label}
        </button>
      )}
    </div>
  );
}

export default function TablaPedidos({
  pedidos,
  vistaActual,
}: {
  pedidos: PedidoFila[];
  contadores: Record<string, number>;
  vistaActual: string;
}) {
  const [filtro, setFiltro] = useState("todos");
  const [pedidosState, setPedidosState] = useState(pedidos);
  const [cargandoId, setCargandoId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setPedidosState(pedidos);
  }, [pedidos]);

  const contadores = useMemo(() => {
    const c: Record<string, number> = { todos: pedidosState.length };
    for (const estado of Object.keys(ESTADOS)) {
      c[estado] = pedidosState.filter((p) => p.estado === estado).length;
    }
    return c;
  }, [pedidosState]);

  const pedidosFiltrados =
    filtro === "todos" ? pedidosState : pedidosState.filter((p) => p.estado === filtro);

  const mostrarFecha = vistaActual === "todos" || vistaActual === "rango";

  function mostrarToast(mensaje: string) {
    setToast(mensaje);
    setTimeout(() => setToast(""), 3500);
  }

  async function cambiarEstado(id: string, estadoActual: EstadoPedido, estadoNuevo: EstadoPedido) {
    setCargandoId(id);
    // Optimista: aplicamos el cambio ya mismo en la UI.
    setPedidosState((prev) => prev.map((p) => (p.id === id ? { ...p, estado: estadoNuevo } : p)));

    try {
      const res = await fetch(`/api/pedidos/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: estadoNuevo }),
      });
      const data = await res.json();

      if (!data.success) {
        // Rollback si el backend rechazó la transición.
        setPedidosState((prev) => prev.map((p) => (p.id === id ? { ...p, estado: estadoActual } : p)));
        mostrarToast(data.error || "No se pudo actualizar el estado del pedido");
      }
    } catch {
      setPedidosState((prev) => prev.map((p) => (p.id === id ? { ...p, estado: estadoActual } : p)));
      mostrarToast("Error de conexión. El pedido no se actualizó.");
    } finally {
      setCargandoId(null);
    }
  }

  const estadoVacio = (
    <div className="py-16 text-center text-ink-500">
      <Tag aria-hidden="true" className="w-12 h-12 text-ink-300 mx-auto mb-3" />
      <p className="text-sm">
        {filtro === "todos"
          ? "No hay pedidos"
          : `No hay pedidos "${ESTADOS[filtro as EstadoPedido]?.label}"`}
      </p>
      <p className="text-xs text-ink-300 mt-1">Los pedidos aparecerán aquí cuando los clientes los realicen en la tienda en línea o por WhatsApp</p>
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
                  : "bg-white border border-ink-200 text-ink-700 hover:bg-ink-50"
              }`}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activo ? "bg-white/20" : "bg-ink-100 text-ink-600"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards móvil/tablet */}
      <div className="lg:hidden space-y-3">
        {pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-card border border-ink-200 shadow-card">{estadoVacio}</div>
        ) : (
          pedidosFiltrados.map((p) => (
            <div key={p.id} className="bg-white rounded-card border border-ink-200 shadow-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-ink-100 rounded-full flex items-center justify-center text-xs font-semibold text-ink-700 flex-shrink-0">
                    {p.clienteNombre.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{p.clienteNombre}</p>
                    <p className="text-xs text-ink-500">
                      {p.rutaNombre} · {p.numProductos} productos
                    </p>
                    {p.fechaEntrega && (
                      <p className="text-xs text-ink-500 mt-0.5">
                        Entrega: <span className="capitalize">{p.fechaEntrega}</span>
                        {mostrarFecha && p.creadoEn && <span> · Creado: {p.creadoEn}</span>}
                      </p>
                    )}
                  </div>
                </div>
                <BadgeEstado estado={p.estado} />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-ink-100 gap-2">
                <span className="text-lg font-bold text-ink-900">{p.total}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ControlEstado pedido={p} cargando={cargandoId === p.id} onCambiarEstado={cambiarEstado} />
                  <Link
                    href={`/pedidos/${p.id}`}
                    className="h-10 px-4 bg-ink-50 border border-ink-200 rounded-control text-sm font-medium text-brand hover:bg-ink-100 transition-colors flex items-center"
                  >
                    Ver
                  </Link>
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
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Cliente</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Ruta</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Productos</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Total</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Estado</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Entrega</th>
              {mostrarFecha && (
                <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Creado</th>
              )}
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {pedidosFiltrados.length === 0 ? (
              <tr><td colSpan={mostrarFecha ? 8 : 7}>{estadoVacio}</td></tr>
            ) : (
              pedidosFiltrados.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-ink-100 rounded-full flex items-center justify-center text-xs font-semibold text-ink-700">
                        {p.clienteNombre.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900">{p.clienteNombre}</p>
                        {p.clienteCodigo && <p className="text-xs text-ink-500">{p.clienteCodigo}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-700">{p.rutaNombre}</td>
                  <td className="py-3 px-4 text-sm text-ink-700">{p.numProductos} productos</td>
                  <td className="py-3 px-4 text-sm font-medium text-ink-900">{p.total}</td>
                  <td className="py-3 px-4"><BadgeEstado estado={p.estado} /></td>
                  <td className="py-3 px-4 text-sm text-ink-600 capitalize">{p.fechaEntrega}</td>
                  {mostrarFecha && (
                    <td className="py-3 px-4 text-sm text-ink-600">{p.creadoEn}</td>
                  )}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-3">
                      <ControlEstado pedido={p} cargando={cargandoId === p.id} onCambiarEstado={cambiarEstado} />
                      <Link href={`/pedidos/${p.id}`} className="text-sm text-brand hover:text-brand-700 font-medium whitespace-nowrap">Ver detalle</Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-ink-900 text-white px-4 py-3 rounded-control shadow-lg text-sm flex items-center gap-2 z-50 max-w-sm">
          <AlertCircle aria-hidden="true" className="w-4 h-4 text-danger flex-shrink-0" />
          {toast}
        </div>
      )}
    </>
  );
}
