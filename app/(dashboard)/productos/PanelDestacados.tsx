"use client";

import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import ProductImage from "@/components/ui/ProductImage";
import Spinner from "@/components/ui/Spinner";
import { ChevronDown, ChevronUp, Star, X } from "@/components/ui/icons";
import { MAX_DESTACADOS, moverEnLista } from "@/lib/destacados";

export interface ProductoDestacable {
  id: string;
  nombre: string;
  imagen_url: string | null;
  activo: boolean;
}

/**
 * Bloque "Destacados en la tienda": lista ordenada de los productos que la
 * tienda muestra arriba de todo. Se agregan con la estrella de cada producto.
 */
export default function PanelDestacados({
  ids,
  productos,
  guardando,
  error,
  onCambiar,
}: {
  ids: string[];
  productos: Map<string, ProductoDestacable>;
  guardando: boolean;
  error: string;
  onCambiar: (ids: string[]) => void;
}) {
  const lista = ids.map((id) => productos.get(id)).filter((p): p is ProductoDestacable => !!p);

  return (
    <Card className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
            <Star aria-hidden="true" className="h-5 w-5 fill-accent text-accent" />
            Destacados en la tienda
          </h2>
          <p className="text-sm text-ink-600">
            Salen de primeros en la tienda, en este orden. Márcalos con la estrella de cada producto.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-600">
          {guardando && <Spinner size="sm" />}
          <span className="tabular-nums">
            {lista.length} de {MAX_DESTACADOS}
          </span>
        </div>
      </div>

      {error && (
        <Alert tone="error" className="mb-3">
          {error}
        </Alert>
      )}

      {lista.length === 0 ? (
        <p className="rounded-control border border-dashed border-ink-300 p-4 text-center text-sm text-ink-600">
          Aún no hay destacados. La franja no aparece en la tienda hasta que marques al menos uno.
        </p>
      ) : (
        <ol className="divide-y divide-ink-100 rounded-control border border-ink-200">
          {lista.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2">
              <span className="w-5 text-center text-sm font-semibold tabular-nums text-ink-600">{i + 1}</span>
              <ProductImage src={p.imagen_url} alt="" className="h-10 w-10 shrink-0 rounded-control" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{p.nombre}</p>
                {!p.activo && (
                  <Badge tone="warn" className="mt-0.5">
                    Inactivo: no se muestra
                  </Badge>
                )}
              </div>
              <div className="flex items-center">
                <IconButton
                  size="sm"
                  aria-label={`Subir ${p.nombre}`}
                  disabled={guardando || i === 0}
                  onClick={() => onCambiar(moverEnLista(ids, ids.indexOf(p.id), -1))}
                >
                  <ChevronUp aria-hidden="true" className="h-4 w-4" />
                </IconButton>
                <IconButton
                  size="sm"
                  aria-label={`Bajar ${p.nombre}`}
                  disabled={guardando || i === lista.length - 1}
                  onClick={() => onCambiar(moverEnLista(ids, ids.indexOf(p.id), 1))}
                >
                  <ChevronDown aria-hidden="true" className="h-4 w-4" />
                </IconButton>
                <IconButton
                  size="sm"
                  aria-label={`Quitar ${p.nombre} de destacados`}
                  disabled={guardando}
                  onClick={() => onCambiar(ids.filter((id) => id !== p.id))}
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
