"use client";

import { useEffect, useRef } from "react";
import Chip from "@/components/ui/Chip";

export interface CategoriaChip {
  id: string;
  nombre: string;
  emoji: string | null;
}

/**
 * Fila horizontal de categorías con "snap". La categoría activa (la que se está
 * viendo al hacer scroll) se centra sola en la fila.
 */
export default function ChipsCategorias({
  categorias,
  activa,
  onSeleccionar,
}: {
  categorias: CategoriaChip[];
  activa: string | null;
  onSeleccionar: (id: string) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activa) return;
    const nodo = contenedor.current?.querySelector<HTMLElement>(`[data-chip="${activa}"]`);
    if (!nodo || !contenedor.current) return;
    const fila = contenedor.current;
    const destino = nodo.offsetLeft - (fila.clientWidth - nodo.offsetWidth) / 2;
    // scroll-behavior se reduce solo con prefers-reduced-motion (ver globals.css)
    fila.scrollTo({ left: destino, behavior: "smooth" });
  }, [activa]);

  return (
    <nav aria-label="Categorías de productos">
      <div
        ref={contenedor}
        className="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1"
      >
        {categorias.map((c) => (
          <Chip
            key={c.id}
            data-chip={c.id}
            selected={activa === c.id}
            onClick={() => onSeleccionar(c.id)}
            className="snap-start"
          >
            {c.emoji && <span aria-hidden="true">{c.emoji}</span>}
            {c.nombre}
          </Chip>
        ))}
      </div>
    </nav>
  );
}
