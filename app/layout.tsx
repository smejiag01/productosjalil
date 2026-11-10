import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import RegistroServiceWorker from "@/components/RegistroServiceWorker";
import AvisoInstalarApp from "@/components/AvisoInstalarApp";

// Texto: Public Sans (muy legible, acentos en español, números tabulares).
const textoFuente = Public_Sans({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

// Display: Fraunces (serif suave con aire artesanal) solo para marca, títulos y precios.
const displayFuente = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Productos Jalil — Panel Administrativo",
  description:
    "Sistema de gestión de pedidos y clientes para Productos Jalil",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Jalil", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#BC4220",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${textoFuente.variable} ${displayFuente.variable}`}>
      <body className="font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
        <RegistroServiceWorker />
        <AvisoInstalarApp />
        {/* Guarda el evento de instalación si llega antes de que cargue React. */}
        <Script id="captura-instalar-app" strategy="beforeInteractive">
          {`window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__pjEventoInstalar=e;});`}
        </Script>
      </body>
    </html>
  );
}
