import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "./icons";

const TONOS = {
  error: { caja: "bg-danger-soft border-danger/30 text-ink-900", icono: "text-danger", Icono: AlertCircle },
  warning: { caja: "bg-warn-soft border-warn/60 text-ink-900", icono: "text-warn-soft-text", Icono: AlertTriangle },
  success: { caja: "bg-ok-soft border-ok/30 text-ink-900", icono: "text-ok", Icono: CheckCircle2 },
  info: { caja: "bg-info-soft border-info/30 text-ink-900", icono: "text-info", Icono: Info },
} as const;

/**
 * Aviso en línea. Los errores y advertencias se anuncian al lector de pantalla
 * (role="alert"); los demás son informativos (role="status").
 */
export default function Alert({
  tone = "info",
  title,
  className,
  children,
}: {
  tone?: keyof typeof TONOS;
  title?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { caja, icono, Icono } = TONOS[tone];
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-control border p-3.5 text-sm", caja, className)}
    >
      <Icono aria-hidden="true" className={cn("mt-0.5 h-5 w-5 flex-shrink-0", icono)} />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5" : undefined}>{children}</div>}
      </div>
    </div>
  );
}
