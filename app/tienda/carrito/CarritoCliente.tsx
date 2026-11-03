"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import { MarcaPJ } from "@/components/ui/Logo";
import ProductImage from "@/components/ui/ProductImage";
import QtyStepper from "@/components/ui/QtyStepper";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  MapPin,
  ShoppingBag,
  Trash2,
} from "@/components/ui/icons";
import { formatearPrecio } from "@/lib/formato";
import { partirEtiquetaFecha } from "@/lib/tienda-ui";
import { useCarrito } from "../CartContext";

export interface LineaHidratada {
  producto_id: string;
  nombre: string;
  unidad: string;
  imagen_url: string | null;
  cantidad: number;
  precio_unitario: number;
}

export interface FechaOpcion {
  valor: string;
  etiqueta: string;
}

export interface SedeOpcion {
  id: string;
  nombre_sede: string;
  direccion: string | null;
}

interface ResumenExito {
  numero: string;
  fecha_entrega: string;
  total: number;
  items: { producto_nombre: string; cantidad: number; subtotal: number }[];
  entrega: { tipo: "sede" | "direccion"; nombre: string | null; direccion: string | null };
}

interface Props {
  lineasIniciales: LineaHidratada[];
  fechas: FechaOpcion[];
  sedes: SedeOpcion[];
  direccionCliente: string | null;
  rutaNombre: string;
  diasRutaLabel: string;
}

/** Opción de un grupo de radios, dibujada como tarjeta (accesible con teclado y lector de pantalla). */
function OpcionRadio({
  name,
  valor,
  seleccionado,
  onChange,
  titulo,
  detalle,
}: {
  name: string;
  valor: string;
  seleccionado: boolean;
  onChange: () => void;
  titulo: string;
  detalle?: string | null;
}) {
  return (
    <label className="relative block cursor-pointer">
      <input
        type="radio"
        name={name}
        value={valor}
        checked={seleccionado}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="block min-h-[56px] rounded-control border-2 border-ink-200 bg-white p-3 transition-colors hover:border-ink-300 peer-checked:border-brand peer-checked:bg-brand-50 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
        <span className="block pr-6 text-sm font-semibold text-ink-900">{titulo}</span>
        {detalle && <span className="mt-0.5 block text-sm text-ink-700">{detalle}</span>}
      </span>
      <Check
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-3 h-5 w-5 text-brand opacity-0 transition-opacity peer-checked:opacity-100"
      />
    </label>
  );
}

function EncabezadoPedido() {
  return (
    <header className="bg-espresso text-white">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
        <Link
          href="/tienda"
          aria-label="Volver a la tienda"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-control text-ink-100 hover:bg-espresso-hover"
        >
          <ChevronLeft aria-hidden="true" className="h-6 w-6" />
        </Link>
        <MarcaPJ size={32} tone="cream" />
        <h1 className="font-display text-xl font-semibold">Tu pedido</h1>
      </div>
    </header>
  );
}

export default function CarritoCliente({
  lineasIniciales,
  fechas,
  sedes,
  direccionCliente,
  rutaNombre,
  diasRutaLabel,
}: Props) {
  const { items, incrementar, decrementar, quitar, limpiar } = useCarrito();

  const infoPorProducto = useMemo(
    () => new Map(lineasIniciales.map((l) => [l.producto_id, l])),
    [lineasIniciales]
  );

  const [fechaSel, setFechaSel] = useState<string>(fechas[0]?.valor ?? "");
  // 1 sede → autoseleccionada; varias → obligatorio elegir; 0 → dirección del cliente.
  const [sedeSel, setSedeSel] = useState<string>(sedes.length === 1 ? sedes[0].id : "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<ResumenExito | null>(null);

  const lineas = useMemo(
    () =>
      items
        .map((i) => {
          const info = infoPorProducto.get(i.producto_id);
          if (!info) return null;
          return { ...info, cantidad: i.cantidad, subtotal: info.precio_unitario * i.cantidad };
        })
        .filter((l): l is LineaHidratada & { subtotal: number } => l !== null),
    [items, infoPorProducto]
  );

  const total = lineas.reduce((s, l) => s + l.subtotal, 0);
  const sedeElegida = sedes.find((s) => s.id === sedeSel) ?? null;
  const debeElegirSede = sedes.length > 1;

  const motivoBloqueo =
    lineas.length === 0
      ? null
      : !fechaSel
        ? "No hay fechas de entrega disponibles"
        : debeElegirSede && !sedeSel
          ? "Elige dónde recibir el pedido"
          : null;
  const puedeConfirmar = lineas.length > 0 && !motivoBloqueo && !enviando;

  async function confirmar() {
    setError(null);
    setEnviando(true);
    try {
      const respuesta = await fetch("/api/tienda/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_entrega: fechaSel,
          sede_id: sedeSel || null,
          items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.success) {
        setError(resultado.error ?? "No pudimos crear tu pedido. Intenta de nuevo.");
        setEnviando(false);
        return;
      }
      limpiar();
      setExito(resultado.data as ResumenExito);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  // --- Pantalla de éxito ---
  if (exito) {
    const etiquetaFechaExito =
      fechas.find((f) => f.valor === exito.fecha_entrega)?.etiqueta ?? exito.fecha_entrega;
    return (
      <div className="min-h-screen bg-paper px-4 py-8">
        <div className="mx-auto max-w-lg">
          <Card padding="lg" className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ok-soft">
              <svg
                viewBox="0 0 24 24"
                className="h-9 w-9 text-ok"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12.5l5 5L20 6.5" strokeDasharray="30" className="animate-check-draw" />
              </svg>
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink-900">¡Pedido confirmado!</h1>
            <p className="mt-1 text-ink-700">
              Pedido{" "}
              <span className="font-display font-semibold tabular-nums text-ink-900">#{exito.numero}</span>
            </p>

            <div className="mt-5 space-y-3 rounded-control bg-ink-50 p-4 text-left">
              <div className="flex items-start gap-2.5">
                <CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Entrega</p>
                  <p className="text-sm font-semibold text-ink-900">{etiquetaFechaExito}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Lugar</p>
                  <p className="text-sm font-semibold text-ink-900">
                    {exito.entrega.tipo === "sede"
                      ? `${exito.entrega.nombre}${exito.entrega.direccion ? ` · ${exito.entrega.direccion}` : ""}`
                      : (exito.entrega.direccion ?? "Dirección registrada")}
                  </p>
                </div>
              </div>
            </div>

            <ul className="mt-5 divide-y divide-ink-100 text-left">
              {exito.items.map((it, idx) => (
                <li key={idx} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                  <span className="text-ink-800">
                    <span className="font-semibold tabular-nums">{it.cantidad}</span> × {it.producto_nombre}
                  </span>
                  <span className="font-semibold tabular-nums text-ink-900">
                    {formatearPrecio(it.subtotal)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-baseline justify-between border-t border-ink-200 pt-4">
              <span className="font-semibold text-ink-900">Total</span>
              <span className="font-display text-3xl font-semibold tabular-nums text-brand">
                {formatearPrecio(exito.total)}
              </span>
            </div>

            <Button href="/tienda" size="xl" fullWidth className="mt-6">
              Volver a la tienda
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // --- Carrito vacío ---
  if (lineas.length === 0) {
    return (
      <div className="min-h-screen bg-paper">
        <EncabezadoPedido />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <Card padding="none">
            <EmptyState
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Tu carrito está vacío"
              description="Agrega productos desde el catálogo para armar tu pedido."
              action={<Button href="/tienda">Ver productos</Button>}
            />
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-52">
      <EncabezadoPedido />

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        <Button
          href="/tienda"
          variant="secondary"
          leftIcon={<ChevronLeft aria-hidden="true" className="h-4 w-4" />}
        >
          Seguir comprando
        </Button>

        {/* Productos */}
        <Card padding="none">
          <ul className="divide-y divide-ink-100">
            {lineas.map((l) => (
              <li key={l.producto_id} className="flex gap-3 p-4">
                <ProductImage
                  src={l.imagen_url}
                  alt=""
                  sizes="80px"
                  className="h-20 w-20 flex-shrink-0 rounded-control"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-semibold leading-snug text-ink-900">{l.nombre}</p>
                    <IconButton
                      aria-label={`Quitar ${l.nombre} del pedido`}
                      size="sm"
                      onClick={() => quitar(l.producto_id)}
                      className="-mr-1 -mt-1"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4 text-ink-600" />
                    </IconButton>
                  </div>
                  <p className="text-sm tabular-nums text-ink-600">
                    {formatearPrecio(l.precio_unitario)} / {l.unidad}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <QtyStepper
                      value={l.cantidad}
                      label={l.nombre}
                      onIncrement={() => incrementar(l.producto_id)}
                      onDecrement={() => decrementar(l.producto_id)}
                    />
                    <span className="font-display text-lg font-semibold tabular-nums text-ink-900">
                      {formatearPrecio(l.subtotal)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Fecha de entrega */}
        <Card>
          <fieldset>
            <legend className="font-display text-lg font-semibold text-ink-900">Fecha de entrega</legend>
            {diasRutaLabel && (
              <p className="mt-0.5 text-sm text-ink-700">
                Tu ruta ({rutaNombre}) entrega los {diasRutaLabel}.
              </p>
            )}
            {fechas.length === 0 ? (
              <Alert tone="warning" className="mt-3">
                No hay fechas de entrega disponibles próximamente. Comunícate con nosotros.
              </Alert>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {fechas.map((f) => {
                  const { dia, fecha } = partirEtiquetaFecha(f.etiqueta);
                  return (
                    <OpcionRadio
                      key={f.valor}
                      name="fecha"
                      valor={f.valor}
                      seleccionado={fechaSel === f.valor}
                      onChange={() => setFechaSel(f.valor)}
                      titulo={dia}
                      detalle={fecha}
                    />
                  );
                })}
              </div>
            )}
          </fieldset>
        </Card>

        {/* Lugar de entrega */}
        <Card>
          <fieldset>
            <legend className="font-display text-lg font-semibold text-ink-900">Lugar de entrega</legend>
            {sedes.length > 1 ? (
              <div className="mt-3 grid gap-2.5">
                {sedes.map((s) => (
                  <OpcionRadio
                    key={s.id}
                    name="sede"
                    valor={s.id}
                    seleccionado={sedeSel === s.id}
                    onChange={() => setSedeSel(s.id)}
                    titulo={s.nombre_sede}
                    detalle={s.direccion}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-2.5 rounded-control bg-ink-50 p-3.5">
                <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
                <p className="text-sm font-medium text-ink-900">
                  {sedes.length === 1
                    ? `${sedes[0].nombre_sede}${sedes[0].direccion ? ` · ${sedes[0].direccion}` : ""}`
                    : (direccionCliente ?? "Se entregará en tu dirección registrada.")}
                </p>
              </div>
            )}
          </fieldset>
        </Card>

        {/* Resumen final */}
        <Card>
          <h2 className="font-display text-lg font-semibold text-ink-900">Revisa antes de confirmar</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-600">Entrega</dt>
              <dd className="text-right font-semibold text-ink-900">
                {fechas.find((f) => f.valor === fechaSel)?.etiqueta ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-600">Lugar</dt>
              <dd className="max-w-[65%] text-right font-semibold text-ink-900">
                {sedeElegida
                  ? `${sedeElegida.nombre_sede}${sedeElegida.direccion ? ` · ${sedeElegida.direccion}` : ""}`
                  : debeElegirSede
                    ? "Elige una sede arriba"
                    : (direccionCliente ?? "Tu dirección registrada")}
              </dd>
            </div>
          </dl>
        </Card>
      </main>

      {/* Barra fija de confirmación */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 shadow-sheet backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          {error && (
            <Alert tone="error" className="mb-3">
              {error}
            </Alert>
          )}
          {motivoBloqueo && !error && (
            <p role="status" className="mb-2 text-sm font-medium text-ink-800">
              {motivoBloqueo}
            </p>
          )}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-ink-600">Total</p>
              <p className="font-display text-2xl font-semibold tabular-nums text-ink-900">
                {formatearPrecio(total)}
              </p>
            </div>
            <Button
              size="xl"
              fullWidth
              loading={enviando}
              disabled={!puedeConfirmar}
              onClick={confirmar}
              className="flex-1"
            >
              {enviando ? "Enviando…" : "Confirmar pedido"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
