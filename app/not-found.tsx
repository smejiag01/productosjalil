import Button from "@/components/ui/Button";
import { MarcaPJ } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center">
      <MarcaPJ size={72} />
      <p className="mt-6 font-display text-6xl font-semibold text-brand">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900">
        No encontramos esa página
      </h1>
      <p className="mt-2 max-w-md text-ink-700">
        Puede que el enlace esté mal escrito o que la página ya no exista.
      </p>
      <div className="mt-6">
        <Button href="/">Ir al inicio</Button>
      </div>
    </main>
  );
}
