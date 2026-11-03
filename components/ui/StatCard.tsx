import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TONOS = {
  neutral: { caja: "bg-white border-ink-200", icono: "bg-ink-100 text-ink-700" },
  brand: { caja: "bg-white border-ink-200", icono: "bg-brand-50 text-brand" },
  warn: { caja: "bg-warn-soft border-warn/50", icono: "bg-white/70 text-warn-soft-text" },
  ok: { caja: "bg-white border-ink-200", icono: "bg-ok-soft text-ok" },
} as const;

/** Indicador (KPI) del Inicio: etiqueta, valor grande en serif y una nota opcional. */
export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: keyof typeof TONOS;
  className?: string;
}) {
  const t = TONOS[tone];
  return (
    <div className={cn("rounded-card border p-4 shadow-card sm:p-5", t.caja, className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-700">{label}</p>
        {icon && (
          <span
            aria-hidden="true"
            className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-control", t.icono)}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-600">{hint}</p>}
    </div>
  );
}
