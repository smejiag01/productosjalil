"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Check,
  CheckCircle2,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Route,
  Truck,
  Undo2,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatearPrecio } from "@/lib/formato";
import { capitalizar, etiquetaDia, textoFechaLarga } from "@/lib/repartidor-fechas";
import {
  calcularProgreso,
  estaListaParaEntrega,
  estaResuelta,
  numerarParadas,
  siguienteParada,
} from "@/lib/repartidor-progreso";
import ModalDevolucion from "./ModalDevolucion";

interface Entrega {
  id: string;
  /** YYYY-MM-DD de la entrega */
  fecha: string;
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

function BarraProgreso({ resueltas, total, porcentaje }: { resueltas: number; total: number; porcentaje: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={resueltas}
      aria-label={`${resueltas} de ${total} entregas resueltas`}
      className="h-3 w-full overflow-hidden rounded-full bg-ink-200"
    >
      <div
        className="h-full rounded-full bg-ok transition-[width] duration-300"
        style={{ width: `${porcentaje}%` }}
      />
    </div>
  );
}

export default function ListaEntregas({
  entregas,
  modo,
  hoy,
  truncado,
}: {
  entregas: Entrega[];
  modo: "dia" | "todos";
  hoy: string;
  /** true si en "Todos los días" se alcanzó el tope y hay entregas más antiguas sin mostrar */
  truncado: boolean;
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState("todos");
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [devolucionPedidoId, setDevolucionPedidoId] = useState<string | null>(null);
  const [entregaPorConfirmar, setEntregaPorConfirmar] = useState<Entrega | null>(null);

  const contadores: Record<string, number> = {
    todos: entregas.length,
    pendientes: entregas.filter((e) => !estaResuelta(e.estado)).length,
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

  // Número de parada dentro de su ruta y día (no cambia al filtrar)
  const paradas = useMemo(
    () => numerarParadas(entregas.map((e) => ({ id: e.id, estado: e.estado, rutaId: `${e.fecha}|${e.rutaId}` }))),
    [entregas]
  );
  // La "siguiente" solo tiene sentido en la jornada de un día concreto
  const idSiguiente = modo === "dia" ? siguienteParada(entregas) : null;

  const filtradas = entregas.filter((e) => {
    if (filtro === "pendientes") return !estaResuelta(e.estado);
    if (filtro === "entregados") return e.estado === "entregado";
    if (filtro === "devueltos") return e.estado === "devuelto";
    return true;
  });

  // En "Todos los días": las entregas se agrupan por fecha (ya vienen de la más reciente a la más antigua).
  const porFecha = useMemo(() => {
    const mapa = new Map<string, Entrega[]>();
    for (const e of filtradas) {
      if (!mapa.has(e.fecha)) mapa.set(e.fecha, []);
      mapa.get(e.fecha)!.push(e);
    }
    return Array.from(mapa.entries());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entregas, filtro]);

  async function marcarEntregado(id: string) {
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
      setEntregaPorConfirmar(null);
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

  function tarjeta(e: Entrega) {
    const puedeActuar = estaListaParaEntrega(e.estado);
    const esSiguiente = e.id === idSiguiente;
    const numero = paradas.get(e.id);
    const resuelta = estaResuelta(e.estado);

    return (
      <article
        key={e.id}
        aria-label={`Parada ${numero}: ${e.cliente.nombre}`}
        className={cn(
          "overflow-hidden rounded-card border bg-white shadow-card",
          esSiguiente ? "border-accent ring-2 ring-accent" : "border-ink-300"
        )}
      >
        {esSiguiente && (
          <p className="flex items-center gap-2 bg-accent px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-ink-900">
            <Navigation aria-hidden="true" className="h-4 w-4" />
            Siguiente parada
          </p>
        )}

        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-display text-xl font-semibold",
                e.estado === "entregado"
                  ? "bg-ok text-white"
                  : e.estado === "devuelto"
                    ? "bg-estado-devuelto text-white"
                    : "bg-espresso text-white"
              )}
            >
              {e.estado === "entregado" ? (
                <Check className="h-6 w-6" />
              ) : e.estado === "devuelto" ? (
                <Undo2 className="h-5 w-5" />
              ) : (
                numero
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl font-semibold leading-tight text-ink-900">
                {e.cliente.nombre}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusBadge estado={e.estado} variant="solid" size="lg" />
                {e.cliente.sedeNombre && (
                  <span className="rounded-full bg-ink-100 px-2.5 py-1 text-sm font-medium text-ink-800">
                    {e.cliente.sedeNombre}
                  </span>
                )}
              </div>
              {rutas.length > 1 && <p className="mt-1.5 text-sm text-ink-700">Ruta: {e.rutaNombre}</p>}
            </div>
          </div>

          {e.cliente.direccion && (
            <p className="flex items-start gap-2 text-lg font-medium leading-snug text-ink-900">
              <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
              {e.cliente.direccion}
            </p>
          )}

          <a
            href={`tel:${e.cliente.telefono}`}
            className="flex min-h-11 items-center gap-2 text-base font-semibold text-brand-700 underline-offset-2 hover:underline"
          >
            <Phone aria-hidden="true" className="h-5 w-5" />
            {e.cliente.telefono}
          </a>

          <div className="rounded-control bg-ink-50 p-3">
            <ul className="space-y-1">
              {e.items.map((it) => (
                <li key={it.id} className="text-base text-ink-900">
                  <span className="font-semibold tabular-nums">{it.cantidad}</span> × {it.nombre}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-ink-200 pt-2">
              <span className="text-sm font-medium text-ink-700">Total</span>
              <span className="font-display text-xl font-semibold tabular-nums text-ink-900">
                {formatearPrecio(e.total)}
              </span>
            </div>
          </div>

          {e.notas && (
            <p className="rounded-control border border-warn/60 bg-warn-soft p-3 text-base text-ink-900">
              <span className="font-semibold">Nota: </span>
              {e.notas}
            </p>
          )}

          <div className="space-y-2">
            {!resuelta && (
              <Button
                href={urlComoLlegar(e.cliente)}
                target="_blank"
                rel="noopener noreferrer"
                variant={esSiguiente ? "primary" : "secondary"}
                size="xl"
                fullWidth
                leftIcon={<Navigation aria-hidden="true" className="h-5 w-5" />}
              >
                Cómo llegar
              </Button>
            )}

            {puedeActuar && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="success"
                  size="xl"
                  onClick={() => setEntregaPorConfirmar(e)}
                  disabled={cargando === e.id}
                  leftIcon={<CheckCircle2 aria-hidden="true" className="h-5 w-5" />}
                >
                  Entregado
                </Button>
                <Button
                  variant="secondary"
                  size="xl"
                  onClick={() => setDevolucionPedidoId(e.id)}
                  disabled={cargando === e.id}
                  leftIcon={<Undo2 aria-hidden="true" className="h-5 w-5" />}
                >
                  Devolución
                </Button>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div>
      {/* Resumen de ruta(s) del día — siempre visible, independiente del filtro activo.
          Solo en la vista "Por día": "Ver ruta completa" arma el recorrido de un día. */}
      {modo === "dia" && entregas.length > 0 && (
        <div className="mb-4 space-y-3">
          {rutas.map((r) => {
            const pendientesRuta = r.entregas.filter((e) => !estaResuelta(e.estado));
            const progreso = calcularProgreso(r.entregas);
            return (
              <section
                key={r.nombre}
                aria-label={`Ruta ${r.nombre}`}
                className="rounded-card border border-ink-300 bg-white p-4 shadow-card"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold text-ink-900">
                    <Route aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-brand-700" />
                    <span className="truncate">Ruta {r.nombre}</span>
                  </h2>
                  <p className="flex-shrink-0 text-base font-semibold tabular-nums text-ink-900">
                    {progreso.resueltas} de {progreso.total}
                  </p>
                </div>
                <BarraProgreso {...progreso} />
                <p className="mb-3 mt-2 text-sm text-ink-700">
                  {progreso.pendientes === 0
                    ? "¡Ruta terminada!"
                    : `${progreso.pendientes} ${progreso.pendientes === 1 ? "parada pendiente" : "paradas pendientes"}`}
                </p>
                {pendientesRuta.length > 0 && (
                  <Button
                    href={urlRutaCompleta(pendientesRuta)}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xl"
                    fullWidth
                    leftIcon={<Route aria-hidden="true" className="h-5 w-5" />}
                  >
                    Ver ruta completa
                  </Button>
                )}
              </section>
            );
          })}
        </div>
      )}

      {entregas.length > 0 && (
        <div
          role="group"
          aria-label="Filtrar entregas"
          className="-mx-1 mb-4 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none"
        >
          {FILTROS.map((f) => (
            <Chip
              key={f.key}
              selected={filtro === f.key}
              count={contadores[f.key] ?? 0}
              onClick={() => setFiltro(f.key)}
              className="h-11"
            >
              {f.label}
            </Chip>
          ))}
        </div>
      )}

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      {entregas.length === 0 ? (
        <div className="rounded-card border border-ink-300 bg-white">
          <EmptyState
            icon={<Truck className="h-7 w-7" />}
            title={modo === "dia" ? "No tienes entregas para este día" : "Aún no tienes entregas"}
            description={
              modo === "dia"
                ? 'Cambia de día con las flechas o el calendario, o mira "Todos los días".'
                : undefined
            }
          />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-card border border-ink-300 bg-white">
          <EmptyState
            icon={<PackageCheck className="h-7 w-7" />}
            title="No hay entregas en esta categoría"
          />
        </div>
      ) : modo === "dia" ? (
        <div className="space-y-4">{filtradas.map(tarjeta)}</div>
      ) : (
        <div className="space-y-6">
          {porFecha.map(([fecha, lista]) => {
            const etiqueta = capitalizar(etiquetaDia(fecha, hoy));
            const larga = capitalizar(textoFechaLarga(fecha, hoy));
            return (
              <section key={fecha}>
                <h2 className="mb-2 flex items-baseline gap-2 font-display text-lg font-semibold text-ink-900">
                  {etiqueta}
                  {etiqueta !== larga && (
                    <span className="font-sans text-sm font-normal text-ink-700">{larga}</span>
                  )}
                  <span className="ml-auto font-sans text-sm font-medium text-ink-700">
                    {lista.length} {lista.length === 1 ? "entrega" : "entregas"}
                  </span>
                </h2>
                <div className="space-y-4">{lista.map(tarjeta)}</div>
              </section>
            );
          })}
          {truncado && (
            <p className="text-center text-sm text-ink-700">
              Se muestran las {entregas.length} entregas más recientes.
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={entregaPorConfirmar !== null}
        title="¿Entregaste este pedido?"
        description={
          entregaPorConfirmar
            ? `${entregaPorConfirmar.cliente.nombre} · ${formatearPrecio(entregaPorConfirmar.total)}`
            : undefined
        }
        confirmLabel="Sí, entregado"
        cancelLabel="Todavía no"
        tone="success"
        size="xl"
        loading={cargando !== null && cargando === entregaPorConfirmar?.id}
        onConfirm={() => entregaPorConfirmar && marcarEntregado(entregaPorConfirmar.id)}
        onCancel={() => setEntregaPorConfirmar(null)}
      />

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
