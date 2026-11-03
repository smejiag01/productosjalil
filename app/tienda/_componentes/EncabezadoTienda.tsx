"use client";

import { MarcaPJ } from "@/components/ui/Logo";
import IconButton from "@/components/ui/IconButton";
import { LogOut, ShoppingCart } from "@/components/ui/icons";

/**
 * Encabezado fijo de la tienda: sello de la casa, nombre del cliente, ícono de
 * carrito con contador (se anuncia a lectores de pantalla y "salta" al cambiar)
 * y salida con objetivo táctil de 44 px.
 */
export default function EncabezadoTienda({
  nombreCliente,
  totalUnidades,
  onAbrirCarrito,
  onSalir,
}: {
  nombreCliente: string;
  totalUnidades: number;
  onAbrirCarrito: () => void;
  onSalir: () => void;
}) {
  return (
    <header className="bg-espresso text-white">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <MarcaPJ size={36} tone="cream" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold leading-tight">
              {nombreCliente}
            </p>
            <p className="text-xs leading-tight text-ink-300">Productos Jalil · Tienda en línea</p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          <div className="relative">
            <IconButton
              variant="inverse"
              aria-label={
                totalUnidades > 0
                  ? `Abrir el carrito, ${totalUnidades} ${totalUnidades === 1 ? "producto" : "productos"}`
                  : "Abrir el carrito, vacío"
              }
              onClick={onAbrirCarrito}
            >
              <ShoppingCart aria-hidden="true" className="h-6 w-6" />
            </IconButton>
            {totalUnidades > 0 && (
              <span
                key={totalUnidades}
                aria-hidden="true"
                className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] animate-pop items-center justify-center rounded-full bg-accent px-1 text-xs font-bold tabular-nums text-ink-900"
              >
                {totalUnidades}
              </span>
            )}
          </div>
          <IconButton variant="inverse" aria-label="Cerrar sesión" onClick={onSalir}>
            <LogOut aria-hidden="true" className="h-5 w-5" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
