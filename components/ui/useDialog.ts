"use client";

import { useEffect, type RefObject } from "react";

const FOCALIZABLES =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Contador para que dos diálogos apilados no se pisen el bloqueo de scroll.
let bloqueos = 0;

/**
 * Comportamiento accesible de un diálogo: foco atrapado dentro, Escape para
 * cerrar, scroll de fondo bloqueado y foco devuelto a quien lo abrió.
 */
export function useDialog(
  abierto: boolean,
  contenedor: RefObject<HTMLElement | null>,
  onClose: () => void,
  cerrablePorTeclado = true
) {
  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement as HTMLElement | null;
    const nodo = contenedor.current;

    bloqueos += 1;
    if (bloqueos === 1) document.body.style.overflow = "hidden";

    // Foco inicial: el primer control del diálogo, o el propio contenedor.
    const primero = nodo?.querySelector<HTMLElement>("[data-autofocus]") ?? nodo?.querySelector<HTMLElement>(FOCALIZABLES);
    (primero ?? nodo)?.focus();

    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape" && cerrablePorTeclado) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !nodo) return;
      const items = Array.from(nodo.querySelectorAll<HTMLElement>(FOCALIZABLES)).filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const inicio = items[0];
      const fin = items[items.length - 1];
      const activo = document.activeElement;
      if (e.shiftKey && (activo === inicio || activo === nodo)) {
        e.preventDefault();
        fin.focus();
      } else if (!e.shiftKey && activo === fin) {
        e.preventDefault();
        inicio.focus();
      }
    }

    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      bloqueos -= 1;
      if (bloqueos === 0) document.body.style.overflow = "";
      previo?.focus?.();
    };
    // onClose se omite a propósito: si cambia en cada render no debe reiniciar el foco.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, cerrablePorTeclado]);
}
