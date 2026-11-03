"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { buttonClass, inputClass } from "@/components/ui/clases";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { addDias } from "@/lib/analiticas/periodos";
import { etiquetaDia, textoFechaLarga } from "@/lib/repartidor-fechas";

/**
 * Navegación de días del repartidor: "Por día" (con anterior, siguiente, selector
 * de fecha y "Hoy") o "Todos los días" (todas sus entregas, de cualquier fecha).
 */
export default function NavegadorDias({
  modo,
  fecha,
  hoy,
}: {
  modo: "dia" | "todos";
  fecha: string;
  hoy: string;
}) {
  const router = useRouter();
  const etiqueta = etiquetaDia(fecha, hoy);
  const larga = textoFechaLarga(fecha, hoy);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex gap-2">
        <Button
          href="/repartidor"
          variant={modo === "dia" ? "primary" : "secondary"}
          size="md"
          className="flex-1"
        >
          Por día
        </Button>
        <Button
          href="/repartidor?vista=todos"
          variant={modo === "todos" ? "primary" : "secondary"}
          size="md"
          className="flex-1"
        >
          Todos los días
        </Button>
      </div>

      {modo === "dia" && (
        <>
          <div className="flex items-center gap-2">
            <Link
              href={`/repartidor?fecha=${addDias(fecha, -1)}`}
              aria-label="Día anterior"
              className={buttonClass({ variant: "secondary", size: "lg", className: "w-12 px-0" })}
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </Link>

            <label className="min-w-0 flex-1">
              <span className="sr-only">Elegir una fecha</span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => {
                  if (e.target.value) router.push(`/repartidor?fecha=${e.target.value}`);
                }}
                className={inputClass({ className: "h-12 text-center font-semibold" })}
              />
            </label>

            <Link
              href={`/repartidor?fecha=${addDias(fecha, 1)}`}
              aria-label="Día siguiente"
              className={buttonClass({ variant: "secondary", size: "lg", className: "w-12 px-0" })}
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </Link>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold capitalize text-ink-900">
              {etiqueta}
              {etiqueta !== larga && <span className="font-normal text-ink-700"> · {larga}</span>}
            </p>
            {fecha !== hoy && (
              <Button href="/repartidor" variant="secondary" size="sm">
                Ir a hoy
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
