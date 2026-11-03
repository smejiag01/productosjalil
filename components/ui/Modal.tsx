"use client";

import { useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import IconButton from "./IconButton";
import { X } from "./icons";
import { useDialog } from "./useDialog";

const TAMANOS = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

/**
 * Diálogo accesible: role="dialog", aria-modal, foco atrapado, Escape, scroll
 * de fondo bloqueado y foco devuelto al cerrar. En móvil sube desde abajo
 * (más fácil de alcanzar con el pulgar); desde `sm` es un cuadro centrado.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof TAMANOS;
  children?: ReactNode;
  footer?: ReactNode;
  /** false = no se cierra con Escape, fondo ni la X (p. ej. mientras guarda). */
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idTitulo = useId();
  const idDescripcion = useId();
  useDialog(open, ref, onClose, dismissible);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        onClick={dismissible ? onClose : undefined}
        className="absolute inset-0 animate-fade-in bg-espresso/60"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={description ? idDescripcion : undefined}
        tabIndex={-1}
        className={cn(
          "pb-safe relative flex max-h-[92vh] w-full flex-col rounded-t-sheet bg-white shadow-sheet outline-none",
          "animate-sheet-up sm:animate-fade-in sm:rounded-card",
          TAMANOS[size]
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-ink-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={idTitulo} className="font-display text-xl font-semibold text-ink-900">
              {title}
            </h2>
            {description && (
              <p id={idDescripcion} className="mt-0.5 text-sm text-ink-600">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <IconButton aria-label="Cerrar" size="sm" onClick={onClose} className="-mr-1.5 -mt-1">
              <X aria-hidden="true" className="h-5 w-5" />
            </IconButton>
          )}
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-ink-200 px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
