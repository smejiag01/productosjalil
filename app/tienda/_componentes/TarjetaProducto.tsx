"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProductImage from "@/components/ui/ProductImage";
import QtyStepper from "@/components/ui/QtyStepper";
import { Plus } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatearPrecio } from "@/lib/formato";

export interface ProductoTienda {
  id: string;
  nombre: string;
  nombre_corto: string | null;
  unidad: string;
  imagen_url: string | null;
  categoria_id: string | null;
  precio: number;
}

/**
 * Tarjeta de producto. "Agregar" se convierte en un selector −/+ y la tarjeta
 * se resalta con "En tu pedido" mientras esté en el carrito.
 */
export default function TarjetaProducto({
  producto,
  cantidad,
  onAgregar,
  onQuitar,
}: {
  producto: ProductoTienda;
  cantidad: number;
  onAgregar: () => void;
  onQuitar: () => void;
}) {
  const enCarrito = cantidad > 0;

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-card border bg-white shadow-card transition-shadow",
        enCarrito ? "border-brand ring-2 ring-brand/30" : "border-ink-200 hover:shadow-raised"
      )}
    >
      <div className="relative">
        <ProductImage
          src={producto.imagen_url}
          alt={producto.nombre}
          className="aspect-[4/3] w-full"
        />
        {enCarrito && (
          <Badge tone="brand" variant="solid" className="absolute left-2 top-2 shadow-sm">
            En tu pedido
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink-900 sm:text-base sm:min-h-[3rem]">
          {producto.nombre}
        </h3>
        <p className="mt-1.5">
          <span className="font-display text-xl font-semibold tabular-nums text-brand">
            {formatearPrecio(producto.precio)}
          </span>
          <span className="ml-1 text-xs text-ink-600">/ {producto.unidad}</span>
        </p>

        <div className="mt-3">
          {enCarrito ? (
            <QtyStepper
              value={cantidad}
              label={producto.nombre}
              onIncrement={onAgregar}
              onDecrement={onQuitar}
              className="w-full justify-between"
            />
          ) : (
            <Button
              fullWidth
              size="md"
              onClick={onAgregar}
              leftIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
              aria-label={`Agregar ${producto.nombre}`}
            >
              Agregar
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
