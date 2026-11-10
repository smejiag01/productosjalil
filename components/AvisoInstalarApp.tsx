"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { MarcaPJ } from "@/components/ui/Logo";
import { Download, Share, SquarePlus } from "@/components/ui/icons";
import { debeMostrarAviso, detectarPlataforma } from "@/lib/instalar-app";

/** Evento de Chrome/Android para instalar la app con un botón propio. */
interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    /** Lo guarda el script del layout raíz si el evento llega antes que React. */
    __pjEventoInstalar?: EventoInstalar;
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

const CLAVE_DESCARTADO = "pj_instalar_app_descartado";
const ESPERA_MS = 2500;

function leerDescartado(): number | null {
  try {
    const valor = Number(window.localStorage.getItem(CLAVE_DESCARTADO));
    return valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

function guardarDescartado() {
  try {
    window.localStorage.setItem(CLAVE_DESCARTADO, String(Date.now()));
  } catch {
    // Sin almacenamiento el aviso puede volver a salir; no pasa nada.
  }
}

/**
 * Ventana "Instalar app" para celular y tablet. En Android usa el instalador
 * del navegador; en iPhone/iPad (que no lo permite) explica cómo agregarla a
 * la pantalla de inicio. En /tienda se instala la app de pedidos de clientes.
 */
export default function AvisoInstalarApp() {
  const pathname = usePathname();
  const [modo, setModo] = useState<"android" | "ios" | null>(null);
  const evento = useRef<EventoInstalar | null>(null);
  const [instalando, setInstalando] = useState(false);

  useEffect(() => {
    const plataforma = detectarPlataforma(navigator.userAgent, navigator.maxTouchPoints ?? 0);
    const instalada =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const mostrar = debeMostrarAviso({
      plataforma,
      esTactil: window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0,
      instalada,
      // Dentro de la APK (Capacitor) o de cualquier WebView de Android ("; wv)").
      dentroDeApk: !!window.Capacitor?.isNativePlatform?.() || /;\s*wv\)/.test(navigator.userAgent),
      descartadoEn: leerDescartado(),
      ahora: Date.now(),
    });
    if (!mostrar) return;

    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const abrirLuego = (m: "android" | "ios") => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => setModo(m), ESPERA_MS);
    };

    if (plataforma === "ios") {
      abrirLuego("ios");
      return () => clearTimeout(temporizador);
    }

    // Android: solo hay botón de instalar si el navegador lo ofrece (si ya
    // está instalada o el navegador no lo permite, no se molesta a nadie).
    const alOfrecer = (e: Event) => {
      e.preventDefault();
      evento.current = e as EventoInstalar;
      abrirLuego("android");
    };
    const alInstalar = () => {
      guardarDescartado();
      setModo(null);
    };
    if (window.__pjEventoInstalar) alOfrecer(window.__pjEventoInstalar);
    window.addEventListener("beforeinstallprompt", alOfrecer);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      clearTimeout(temporizador);
      window.removeEventListener("beforeinstallprompt", alOfrecer);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  if (!modo) return null;

  const enTienda = pathname?.startsWith("/tienda");
  const nombreApp = enTienda ? "Jalil Pedidos" : "Productos Jalil";

  function cerrar() {
    guardarDescartado();
    setModo(null);
  }

  async function instalar() {
    const e = evento.current ?? window.__pjEventoInstalar;
    if (!e) return cerrar();
    setInstalando(true);
    try {
      await e.prompt();
      await e.userChoice;
    } finally {
      evento.current = null;
      window.__pjEventoInstalar = undefined;
      setInstalando(false);
      cerrar();
    }
  }

  return (
    <Modal
      open
      onClose={cerrar}
      title={`Instala la app ${nombreApp}`}
      size="sm"
      footer={
        modo === "android" ? (
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={cerrar}>
              Ahora no
            </Button>
            <Button
              loading={instalando}
              onClick={instalar}
              leftIcon={<Download aria-hidden="true" className="h-5 w-5" />}
            >
              Instalar app
            </Button>
          </div>
        ) : (
          <div className="flex w-full justify-end">
            <Button variant="secondary" onClick={cerrar}>
              Entendido
            </Button>
          </div>
        )
      }
    >
      <div className="flex items-center gap-3">
        <MarcaPJ size={48} />
        <p className="text-base text-ink-800">
          {enTienda
            ? "Haz tus pedidos más rápido: queda en tu pantalla de inicio como cualquier app."
            : "Ábrela desde tu pantalla de inicio, a pantalla completa y más rápido."}
        </p>
      </div>

      {modo === "ios" && (
        <ol className="mt-4 space-y-3 text-base text-ink-800">
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand">
              1
            </span>
            <span>
              Toca el botón <strong>Compartir</strong>{" "}
              <Share aria-label="(cuadro con flecha hacia arriba)" className="inline h-5 w-5 align-text-bottom text-info" /> en
              la barra de Safari.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand">
              2
            </span>
            <span>
              Elige <strong>Agregar a pantalla de inicio</strong>{" "}
              <SquarePlus aria-hidden="true" className="inline h-5 w-5 align-text-bottom text-ink-700" /> y luego{" "}
              <strong>Agregar</strong>.
            </span>
          </li>
        </ol>
      )}
    </Modal>
  );
}
