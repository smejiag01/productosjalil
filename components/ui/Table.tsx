import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Tabla del sistema: tarjeta con scroll horizontal, encabezado fijo en tono
 * crema y filas con realce al pasar el cursor. Un solo estilo para las 17
 * tablas del panel.
 */
export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-ink-200 bg-white shadow-card">
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

export function Th({
  align = "left",
  className,
  ...resto
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap border-b border-ink-200 bg-ink-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-600",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className
      )}
      {...resto}
    />
  );
}

export function Tr({ className, ...resto }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-ink-100 transition-colors last:border-0 hover:bg-ink-50/70",
        className
      )}
      {...resto}
    />
  );
}

export function Td({
  numeric,
  className,
  ...resto
}: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-ink-800",
        numeric && "text-right tabular-nums",
        className
      )}
      {...resto}
    />
  );
}
