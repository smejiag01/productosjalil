import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ChevronLeft } from "./icons";

/** Encabezado de página: título (con conteo opcional), subtítulo y acciones. */
export default function PageHeader({
  title,
  subtitle,
  count,
  actions,
  back,
  className,
}: {
  title: string;
  subtitle?: string;
  /** Ej. "162 clientes": aparece como píldora junto al título. */
  count?: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <header className={cn("mb-6", className)}>
      {back && (
        <Link
          href={back.href}
          className="mb-2 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">{title}</h1>
            {count && (
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-sm font-semibold text-ink-700">
                {count}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm text-ink-600">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
