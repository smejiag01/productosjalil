"use client";

import { useCallback, useState, type ReactNode } from "react";
import ConfirmDialog from "./ConfirmDialog";

interface OpcionesConfirmacion {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger" | "success";
}

/**
 * Reemplazo de `window.confirm()` que se usa igual, con await:
 *
 *   const { confirmar, dialogo } = useConfirmar();
 *   if (!(await confirmar({ title: "¿Eliminar?", tone: "danger" }))) return;
 *   ...
 *   return <>{...}{dialogo}</>;
 */
export function useConfirmar(): {
  confirmar: (opciones: OpcionesConfirmacion) => Promise<boolean>;
  dialogo: ReactNode;
} {
  const [pendiente, setPendiente] = useState<{
    opciones: OpcionesConfirmacion;
    resolver: (acepto: boolean) => void;
  } | null>(null);

  const confirmar = useCallback(
    (opciones: OpcionesConfirmacion) =>
      new Promise<boolean>((resolver) => setPendiente({ opciones, resolver })),
    []
  );

  function responder(acepto: boolean) {
    pendiente?.resolver(acepto);
    setPendiente(null);
  }

  const dialogo = (
    <ConfirmDialog
      open={pendiente !== null}
      title={pendiente?.opciones.title ?? ""}
      description={pendiente?.opciones.description}
      confirmLabel={pendiente?.opciones.confirmLabel}
      cancelLabel={pendiente?.opciones.cancelLabel}
      tone={pendiente?.opciones.tone}
      onConfirm={() => responder(true)}
      onCancel={() => responder(false)}
    />
  );

  return { confirmar, dialogo };
}
