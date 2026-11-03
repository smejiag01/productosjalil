"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Propiedades que Field le entrega al control para enlazar etiqueta, ayuda y error. */
export interface PropsControl {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

/**
 * Etiqueta + control + ayuda + error, con ids y aria-* enlazados solos:
 *
 *   <Field label="NIT" error={errores.nit}>
 *     {(p) => <Input {...p} value={nit} onChange={...} />}
 *   </Field>
 */
export default function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: PropsControl) => ReactNode;
}) {
  const id = useId();
  const idAyuda = hint ? `${id}-hint` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const describedby = [idError, idAyuda].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink-800">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-describedby": describedby,
        "aria-invalid": error ? true : undefined,
      })}
      {hint && !error && (
        <p id={idAyuda} className="text-xs text-ink-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
