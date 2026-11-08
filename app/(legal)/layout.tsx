import Link from "next/link";
import { MarcaPJ } from "@/components/ui/Logo";

export const metadata = {
  title: { template: "%s — Productos Jalil", default: "Productos Jalil" },
};

const ENLACES = [
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/eliminacion-de-datos", label: "Eliminación de datos" },
];

/** Páginas legales públicas (las pide Meta para publicar la app de WhatsApp). */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-espresso">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <MarcaPJ size={44} />
          <span className="font-display text-lg font-semibold text-white">Productos Jalil</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <article className="rounded-card border border-ink-200 bg-white p-6 shadow-card sm:p-10">
          {children}
        </article>

        <nav aria-label="Documentos legales" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {ENLACES.map((e) => (
            <Link key={e.href} href={e.href} className="font-medium text-brand-700 hover:underline">
              {e.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
