"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { MarcaPJ } from "@/components/ui/Logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center">
      <MarcaPJ size={72} />
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink-900">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-ink-700">
        Ocurrió un error inesperado. Puedes intentarlo de nuevo; si sigue pasando, avísanos.
      </p>
      {error.digest && <p className="mt-2 text-xs text-ink-600">Código: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Reintentar</Button>
        <Button href="/" variant="secondary">
          Ir al inicio
        </Button>
      </div>
    </main>
  );
}
