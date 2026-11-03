"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useDialog } from "./useDialog";

const PANEL = {
  bottom:
    "inset-x-0 bottom-0 max-h-[90vh] rounded-t-sheet shadow-sheet animate-sheet-up pb-safe",
  left: "inset-y-0 left-0 w-[85%] max-w-xs animate-slide-in-left",
} as const;

/**
 * Panel deslizante accesible (hoja inferior o cajón lateral). Comparte con
 * Modal el comportamiento de foco, Escape y bloqueo de scroll. `label` es el
 * nombre accesible porque estos paneles no siempre llevan título visible.
 */
export default function Sheet({
  open,
  onClose,
  side = "bottom",
  label,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: keyof typeof PANEL;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(open, ref, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-espresso/60"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn("absolute flex flex-col outline-none", PANEL[side], className)}
      >
        {children}
      </div>
    </div>
  );
}
