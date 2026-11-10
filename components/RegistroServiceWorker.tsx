"use client";

import { useEffect } from "react";

/** Registra public/sw.js (solo en producción) para la app instalable. */
export default function RegistroServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Sin service worker la app funciona igual, solo que no abre sin señal.
    });
  }, []);
  return null;
}
