import Skeleton from "@/components/ui/Skeleton";

/** Esqueleto del catálogo mientras llegan los datos (las páginas son dinámicas). */
export default function CargandoTienda() {
  return (
    <div className="min-h-screen bg-paper" aria-busy="true" aria-label="Cargando la tienda">
      <div className="h-16 bg-espresso" />
      <div className="border-b border-ink-200 bg-paper">
        <div className="mx-auto max-w-4xl space-y-3 px-4 py-3">
          <Skeleton className="h-11 w-full" />
          <div className="flex gap-2 overflow-hidden">
            {["w-28", "w-24", "w-20", "w-28", "w-24"].map((ancho, i) => (
              <Skeleton key={i} className={`h-10 flex-shrink-0 rounded-full ${ancho}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-5">
        <Skeleton className="mb-5 h-14 w-full" />
        <Skeleton className="mb-3 h-7 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-card border border-ink-200 bg-white">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
