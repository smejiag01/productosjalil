"use client";

import type { ReactNode } from "react";
import TarjetaProducto, { type ProductoTienda } from "./TarjetaProducto";

/**
 * Franja horizontal de productos (Destacados, Tus habituales): tarjetas que se
 * deslizan de lado con encaje suave y botón para agregar directo al carrito.
 */
export default function FranjaProductos({
  id,
  titulo,
  icono,
  descripcion,
  productos,
  cantidadDe,
  onAgregar,
  onQuitar,
}: {
  id: string;
  titulo: string;
  icono: ReactNode;
  descripcion?: string;
  productos: ProductoTienda[];
  cantidadDe: (id: string) => number;
  onAgregar: (id: string) => void;
  onQuitar: (id: string) => void;
}) {
  if (productos.length === 0) return null;
  const idTitulo = `franja-${id}`;

  return (
    <section aria-labelledby={idTitulo} className="mb-8">
      <div className="mb-3">
        <h2 id={idTitulo} className="flex items-center gap-2 font-display text-xl font-semibold text-ink-900">
          {icono}
          {titulo}
        </h2>
        {descripcion && <p className="text-sm text-ink-600">{descripcion}</p>}
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:gap-4">
        {productos.map((p) => (
          <li key={p.id} className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[23%]">
            <TarjetaProducto
              producto={p}
              cantidad={cantidadDe(p.id)}
              onAgregar={() => onAgregar(p.id)}
              onQuitar={() => onQuitar(p.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
