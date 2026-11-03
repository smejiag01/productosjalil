"use client";

import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import ProductImage from "@/components/ui/ProductImage";
import QtyStepper from "@/components/ui/QtyStepper";
import Sheet from "@/components/ui/Sheet";
import { ArrowRight, Trash2, X } from "@/components/ui/icons";
import { formatearPrecio } from "@/lib/formato";
import type { ProductoTienda } from "./TarjetaProducto";

export interface LineaCarrito {
  producto: ProductoTienda;
  cantidad: number;
  subtotal: number;
}

/**
 * Barra inferior del carrito: resume cantidad y total, abre una hoja con el
 * detalle (donde se puede ajustar o quitar) y lleva al carrito. Respeta el área
 * segura de los celulares (pb-safe) y sube con animación al aparecer.
 */
export default function BarraCarrito({
  lineas,
  totalUnidades,
  total,
  abierta,
  yendo,
  onAbrir,
  onCerrar,
  onIncrementar,
  onDecrementar,
  onQuitar,
  onIrAlCarrito,
}: {
  lineas: LineaCarrito[];
  totalUnidades: number;
  total: number;
  abierta: boolean;
  yendo: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
  onIncrementar: (id: string) => void;
  onDecrementar: (id: string) => void;
  onQuitar: (id: string) => void;
  onIrAlCarrito: () => void;
}) {
  return (
    <>
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 animate-sheet-up border-t border-ink-200 bg-white/95 shadow-sheet backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={onAbrir}
            aria-haspopup="dialog"
            className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 rounded-control text-left"
          >
            <span
              key={totalUnidades}
              className="flex h-9 min-w-[2.25rem] animate-pop items-center justify-center rounded-full bg-brand px-2 text-sm font-bold tabular-nums text-white"
            >
              {totalUnidades}
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-ink-600">Tu pedido · toca para ver</span>
              <span className="block font-display text-xl font-semibold tabular-nums text-ink-900">
                {formatearPrecio(total)}
              </span>
            </span>
          </button>
          <Button
            size="lg"
            onClick={onIrAlCarrito}
            loading={yendo}
            rightIcon={<ArrowRight aria-hidden="true" className="h-5 w-5" />}
          >
            Ir al carrito
          </Button>
        </div>
      </div>

      <Sheet open={abierta} onClose={onCerrar} label="Tu pedido" className="bg-white">
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-ink-900">Tu pedido</h2>
          <IconButton aria-label="Cerrar" size="sm" onClick={onCerrar}>
            <X aria-hidden="true" className="h-5 w-5" />
          </IconButton>
        </div>

        <ul className="divide-y divide-ink-100 overflow-y-auto px-5">
          {lineas.map((l) => (
            <li key={l.producto.id} className="flex gap-3 py-3">
              <ProductImage
                src={l.producto.imagen_url}
                alt=""
                sizes="64px"
                className="h-16 w-16 flex-shrink-0 rounded-control"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900">
                    {l.producto.nombre}
                  </p>
                  <IconButton
                    aria-label={`Quitar ${l.producto.nombre} del pedido`}
                    size="sm"
                    onClick={() => onQuitar(l.producto.id)}
                    className="-mr-1.5 -mt-1.5"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4 text-ink-600" />
                  </IconButton>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <QtyStepper
                    value={l.cantidad}
                    label={l.producto.nombre}
                    onIncrement={() => onIncrementar(l.producto.id)}
                    onDecrement={() => onDecrementar(l.producto.id)}
                  />
                  <span className="font-display text-lg font-semibold tabular-nums text-ink-900">
                    {formatearPrecio(l.subtotal)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-ink-200 p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm font-medium text-ink-700">Total</span>
            <span className="font-display text-2xl font-semibold tabular-nums text-ink-900">
              {formatearPrecio(total)}
            </span>
          </div>
          <Button
            fullWidth
            size="xl"
            onClick={onIrAlCarrito}
            loading={yendo}
            rightIcon={<ArrowRight aria-hidden="true" className="h-5 w-5" />}
          >
            Ir al carrito
          </Button>
        </div>
      </Sheet>
    </>
  );
}
