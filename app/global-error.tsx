"use client";

import "./globals.css";

// Último recurso: reemplaza al layout raíz, así que trae su propio html/body.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body className="bg-paper text-ink-900 antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-semibold">Algo salió mal</h1>
          <p className="mt-2 max-w-md text-ink-700">
            La aplicación tuvo un error inesperado. Intenta de nuevo.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 h-11 rounded-control bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
