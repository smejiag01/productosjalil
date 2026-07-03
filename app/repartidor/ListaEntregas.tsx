"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BadgeEstado from "@/components/BadgeEstado";
import { formatearPrecio } from "@/lib/formato";
import ModalDevolucion from "./ModalDevolucion";

interface Entrega {
  id: string;
  estado: string;
  total: number;
  notas: string | null;
  rutaId: string;
  rutaNombre: string;
  cliente: {
    nombre: string;
    telefono: string;
    sedeNombre: string | null;
    direccion: string | null;
    latitud: number | null;
    longitud: number | null;
  };
  items: { id: string; nombre: string; cantidad: number }[];
}

const FILTROS: { key: string; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendientes", label: "Pendientes" },
  { key: "entregados", label: "Entregados" },
  { key: "devueltos", label: "Devueltos" },
];

// Máximo de paradas intermedias que soporta la URL de Google Maps (waypoints)
const MAX_WAYPOINTS = 9;

function puntoCliente(cliente: Entrega["cliente"]): string {
  if (cliente.latitud != null && cliente.longitud != null) {
    return `${cliente.latitud},${cliente.longitud}`;
  }
  return cliente.direccion || cliente.nombre;
}

function urlComoLlegar(cliente: Entrega["cliente"]): string {
  return `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(puntoCliente(cliente))}`;
}

function urlRutaCompleta(entregasRuta: Entrega[]): string {
  const puntos = entregasRuta.map((e) => puntoCliente(e.cliente));
  const destino = encodeURIComponent(puntos[puntos.length - 1]);
  const intermedias = puntos.slice(0, -1).slice(0, MAX_WAYPOINTS);
  const base = `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${destino}`;
  return intermedias.length > 0
    ? `${base}&waypoints=${intermedias.map((p) => encodeURIComponent(p)).join("|")}`
    : base;
}

export default function ListaEntregas({ entregas }: { entregas: Entrega[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState("todos");
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [devolucionPedidoId, setDevolucionPedidoId] = useState<string | null>(null);

  const contadores: Record<string, number> = {
    todos: entregas.length,
    pendientes: entregas.filter((e) => e.estado !== "entregado" && e.estado !== "devuelto").length,
    entregados: entregas.filter((e) => e.estado === "entregado").length,
    devueltos: entregas.filter((e) => e.estado === "devuelto").length,
  };

  // Agrupado por ruta a partir del listado completo (sin filtrar por tab),
  // para que "Ver ruta completa" siempre refleje las paradas reales pendientes.
  const rutas = useMemo(() => {
    const mapa = new Map<string, { nombre: string; entregas: Entrega[] }>();
    for (const e of entregas) {
      if (!mapa.has(e.rutaId)) mapa.set(e.rutaId, { nombre: e.rutaNombre, entregas: [] });
      mapa.get(e.rutaId)!.entregas.push(e);
    }
    return Array.from(mapa.values());
  }, [entregas]);

  const filtradas = entregas.filter((e) => {
    if (filtro === "pendientes") return e.estado !== "entregado" && e.estado !== "devuelto";
    if (filtro === "entregados") return e.estado === "entregado";
    if (filtro === "devueltos") return e.estado === "devuelto";
    return true;
  });

  async function marcarEntregado(id: string) {
    if (!confirm("¿Confirmas que este pedido fue entregado?")) return;
    setCargando(id);
    setError("");
    try {
      const res = await fetch(`/api/pedidos/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "entregado" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al actualizar el pedido");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(null);
    }
  }

  async function confirmarDevolucion(id: string, motivo: string) {
    setCargando(id);
    setError("");
    try {
      const res = await fetch(`/api/pedidos/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "devuelto", motivo }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al registrar la devolución");
        return;
      }
      setDevolucionPedidoId(null);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(null);
    }
  }

  return (
    <div>
      {/* Resumen de ruta(s) — siempre visible, independiente del filtro activo */}
      <div className="space-y-2 mb-4">
        {rutas.map((r) => {
          const pendientesRuta = r.entregas.filter((e) => e.estado !== "entregado" && e.estado !== "devuelto");
          return (
            <div key={r.nombre} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">🗺️ Ruta {r.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {pendientesRuta.length} de {r.entregas.length} paradas pendientes
                  </p>
                </div>
              </div>
              {pendientesRuta.length > 0 && (
                <a
                  href={urlRutaCompleta(pendientesRuta)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 flex items-center justify-center gap-2 bg-brand text-white rounded-lg text-sm font-medium"
                >
                  🗺️ Ver ruta completa
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {FILTROS.map((f) => {
          const activo = filtro === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`h-10 px-3 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                activo ? "bg-brand text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activo ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
                {contadores[f.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          <p className="text-sm">No hay entregas en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((e) => {
            const puedeActuar = e.estado !== "entregado" && e.estado !== "devuelto";
            return (
              <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold text-gray-900 truncate">{e.cliente.nombre}</p>
                      {e.cliente.sedeNombre && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex-shrink-0">{e.cliente.sedeNombre}</span>
                      )}
                    </div>
                    <a href={`tel:${e.cliente.telefono}`} className="text-sm text-brand font-medium flex items-center gap-1.5 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      {e.cliente.telefono}
                    </a>
                    {e.cliente.direccion && (
                      <p className="text-xs text-gray-500 mt-1">{e.cliente.direccion}</p>
                    )}
                    {rutas.length > 1 && (
                      <p className="text-xs text-gray-400 mt-1">Ruta: {e.rutaNombre}</p>
                    )}
                  </div>
                  <BadgeEstado estado={e.estado} />
                </div>

                <div className="border-t border-gray-100 pt-3 mb-3">
                  <ul className="space-y-1">
                    {e.items.map((it) => (
                      <li key={it.id} className="text-sm text-gray-600 flex justify-between">
                        <span>{it.cantidad} × {it.nombre}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">Total</span>
                    <span className="text-base font-bold text-gray-900">{formatearPrecio(e.total)}</span>
                  </div>
                </div>

                <a
                  href={urlComoLlegar(e.cliente)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium mb-2"
                >
                  📍 Cómo llegar
                </a>

                {puedeActuar && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => marcarEntregado(e.id)}
                      disabled={cargando === e.id}
                      className="h-11 flex items-center justify-center gap-1.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {cargando === e.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>✅ Entregado</>
                      )}
                    </button>
                    <button
                      onClick={() => setDevolucionPedidoId(e.id)}
                      disabled={cargando === e.id}
                      className="h-11 flex items-center justify-center gap-1.5 bg-white border border-orange-300 text-orange-700 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      ↩️ Devolución
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {devolucionPedidoId && (
        <ModalDevolucion
          cargando={cargando === devolucionPedidoId}
          onConfirmar={(motivo) => confirmarDevolucion(devolucionPedidoId, motivo)}
          onCerrar={() => setDevolucionPedidoId(null)}
        />
      )}
    </div>
  );
}
