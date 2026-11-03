import Skeleton from "@/components/ui/Skeleton";

/** Esqueleto del carrito mientras se resuelven fechas, sedes y precios. */
export default function CargandoCarrito() {
  return (
    <div className="min-h-screen bg-paper" aria-busy="true" aria-label="Cargando tu pedido">
      <div className="h-16 bg-espresso" />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        <Skeleton className="h-11 w-44" />
        <div className="space-y-4 rounded-card border border-ink-200 bg-white p-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-20 w-20 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-11 w-36" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-28 w-full rounded-card" />
      </div>
    </div>
  );
}
