"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatearPrecio } from "@/lib/formato";
import { useCarrito } from "../CartContext";

export interface LineaHidratada {
  producto_id: string;
  nombre: string;
  unidad: string;
  imagen_url: string | null;
  cantidad: number;
  precio_unitario: number;
}

function Miniatura({
  nombre,
  imagenUrl,
  className = "",
}: {
  nombre: string;
  imagenUrl: string | null;
  className?: string;
}) {
  if (imagenUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imagenUrl}
        alt={nombre}
        loading="lazy"
        className={`object-cover bg-gray-100 ${className}`}
      />
    );
  }
  return (
    <div className={`bg-gray-100 flex items-center justify-center text-gray-300 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-1/2 h-1/2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    </div>
  );
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
  // 1 sede → autoseleccionada; varias → obligatorio elegir; 0 → dirección.
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
  const puedeConfirmar =
    lineas.length > 0 &&
    !!fechaSel &&
    (!debeElegirSede || !!sedeSel) &&
    !enviando;

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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-green-200 p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 text-green-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">¡Pedido confirmado!</h1>
            <p className="text-sm text-gray-500 mt-1">
              Pedido #{exito.numero} · Entrega: {etiquetaFechaExito}
            </p>

            <div className="mt-4 text-left bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Entrega en
              </p>
              {exito.entrega.tipo === "sede" ? (
                <p className="text-sm text-gray-800">
                  {exito.entrega.nombre}
                  {exito.entrega.direccion ? ` · ${exito.entrega.direccion}` : ""}
                </p>
              ) : (
                <p className="text-sm text-gray-800">
                  {exito.entrega.direccion ?? "Dirección registrada"}
                </p>
              )}
            </div>

            <div className="mt-4 text-left divide-y divide-gray-100">
              {exito.items.map((it, idx) => (
                <div key={idx} className="flex justify-between py-2 text-sm">
                  <span className="text-gray-700">
                    {it.cantidad} × {it.producto_nombre}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {formatearPrecio(it.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-brand">{formatearPrecio(exito.total)}</span>
            </div>

            <Link
              href="/tienda"
              className="mt-6 inline-flex items-center justify-center w-full h-11 bg-brand text-white rounded-xl font-semibold hover:bg-brand-light transition-colors"
            >
              Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Carrito vacío ---
  if (lineas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/tienda" className="text-sm text-gray-400 hover:text-gray-600">
            ← Volver a la tienda
          </Link>
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            <p className="text-sm">Tu carrito está vacío.</p>
            <Link href="/tienda" className="mt-3 inline-block text-brand text-sm font-medium">
              Ver productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link
          href="/tienda"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Seguir comprando
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-3 mb-4">Tu pedido</h1>

        {/* Líneas */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-4">
          {lineas.map((l) => (
            <div key={l.producto_id} className="p-3 flex gap-3">
              <Miniatura
                nombre={l.nombre}
                imagenUrl={l.imagen_url}
                className="w-16 h-16 rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{l.nombre}</p>
                  <button
                    onClick={() => quitar(l.producto_id)}
                    aria-label="Eliminar producto"
                    className="text-gray-400 hover:text-red-600 flex-shrink-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatearPrecio(l.precio_unitario)} / {l.unidad}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrementar(l.producto_id)}
                      aria-label="Quitar uno"
                      className="w-8 h-8 rounded-lg border border-gray-300 text-gray-700 text-lg hover:bg-gray-50 flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{l.cantidad}</span>
                    <button
                      onClick={() => incrementar(l.producto_id)}
                      aria-label="Agregar uno"
                      className="w-8 h-8 rounded-lg bg-brand text-white text-lg hover:bg-brand-light flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatearPrecio(l.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div className="p-3 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-brand text-lg">{formatearPrecio(total)}</span>
          </div>
        </div>

        {/* Checkout: fecha + sede al final */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de entrega
            </label>
            {diasRutaLabel && (
              <p className="text-xs text-gray-500 mb-1.5">
                Tu ruta ({rutaNombre}) entrega los {diasRutaLabel}.
              </p>
            )}
            {fechas.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                No hay fechas de entrega disponibles próximamente. Comunícate con
                nosotros.
              </p>
            ) : (
              <select
                value={fechaSel}
                onChange={(e) => setFechaSel(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                {fechas.map((f) => (
                  <option key={f.valor} value={f.valor}>
                    {f.etiqueta}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lugar de entrega
            </label>
            {sedes.length === 0 ? (
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2">
                {direccionCliente ?? "Se entregará en tu dirección registrada."}
              </p>
            ) : sedes.length === 1 ? (
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2">
                {sedes[0].nombre_sede}
                {sedes[0].direccion ? ` · ${sedes[0].direccion}` : ""}
              </p>
            ) : (
              <select
                value={sedeSel}
                onChange={(e) => setSedeSel(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                <option value="">Elige dónde recibir el pedido…</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre_sede}
                    {s.direccion ? ` · ${s.direccion}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Resumen final antes de confirmar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 text-sm">
          <p className="font-semibold text-gray-900 mb-2">Revisa antes de confirmar</p>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Entrega</span>
            <span className="text-gray-800 text-right">
              {fechas.find((f) => f.valor === fechaSel)?.etiqueta ?? "—"}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Lugar</span>
            <span className="text-gray-800 text-right max-w-[65%]">
              {sedeElegida
                ? `${sedeElegida.nombre_sede}${sedeElegida.direccion ? ` · ${sedeElegida.direccion}` : ""}`
                : debeElegirSede
                  ? "Elige una sede arriba"
                  : direccionCliente ?? "Tu dirección registrada"}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">{formatearPrecio(total)}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={confirmar}
          disabled={!puedeConfirmar}
          className="w-full h-12 bg-brand text-white rounded-xl font-semibold hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando ? "Enviando…" : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}
