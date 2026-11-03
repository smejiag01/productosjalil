import type { ReactNode } from "react";
import Logo from "./Logo";

/**
 * Plantilla de las pantallas de acceso (panel admin y tienda): fondo espresso
 * con brillos cálidos, sello de la casa y una tarjeta clara con el formulario.
 */
export default function AuthCard({
  title,
  subtitle,
  etiqueta,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  /** Texto corto bajo el logo, p. ej. "Tienda en línea" o "Panel administrativo". */
  etiqueta?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-espresso px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-brand/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo variant="stacked" tone="cream" size={64} />
          {etiqueta && (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink-900">
              {etiqueta}
            </span>
          )}
        </div>

        <div className="rounded-card bg-white p-6 shadow-raised sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-ink-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-xs text-ink-300">{footer}</div>}
      </div>
    </div>
  );
}
