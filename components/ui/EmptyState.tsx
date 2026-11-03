import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Estado vacío con ícono, mensaje y (opcional) acción. Reemplaza los "No hay…" sueltos. */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand"
        >
          {icon}
        </div>
      )}
      <p className="font-display text-lg font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
