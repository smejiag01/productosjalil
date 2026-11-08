import type { ReactNode } from "react";
import { formatearWhatsapp, type DatosNegocio } from "@/lib/datos-negocio";

/** Fecha desde la que rigen los documentos legales. */
export const FECHA_VIGENCIA = "8 de noviembre de 2026";

export function Encabezado({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <header className="mb-8 border-b border-ink-200 pb-6">
      <h1 className="font-display text-3xl font-semibold text-ink-900">{titulo}</h1>
      <p className="mt-2 text-sm text-ink-600">Vigente desde el {FECHA_VIGENCIA}.</p>
      {children && <div className="mt-4 text-base leading-relaxed text-ink-800">{children}</div>}
    </header>
  );
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-xl font-semibold text-ink-900">{titulo}</h2>
      <div className="space-y-3 text-base leading-relaxed text-ink-800">{children}</div>
    </section>
  );
}

export function Lista({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-6 marker:text-brand-600">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** Quién es el responsable y cómo contactarlo, con los datos que haya configurados. */
export function DatosContacto({ negocio }: { negocio: DatosNegocio }) {
  const filas: [string, ReactNode][] = [
    ["Razón social", negocio.razonSocial],
    ["Nombre comercial", negocio.nombre],
  ];
  if (negocio.nit) filas.push(["NIT", negocio.nit]);
  if (negocio.direccion) filas.push(["Dirección", negocio.direccion]);
  if (negocio.telefono) filas.push(["Teléfono", negocio.telefono]);
  if (negocio.whatsapp) {
    filas.push([
      "WhatsApp de atención",
      <a
        key="wa"
        href={`https://wa.me/${negocio.whatsapp}`}
        className="font-medium text-brand-700 hover:underline"
      >
        {formatearWhatsapp(negocio.whatsapp)}
      </a>,
    ]);
  }

  return (
    <dl className="grid gap-x-6 gap-y-2 rounded-control border border-ink-200 bg-ink-50 p-4 text-sm sm:grid-cols-[auto_1fr]">
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="contents">
          <dt className="font-semibold text-ink-700">{etiqueta}</dt>
          <dd className="text-ink-900">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Frase con el canal para ejercer derechos o hacer solicitudes. */
export function CanalContacto({ negocio }: { negocio: DatosNegocio }) {
  if (negocio.whatsapp) {
    return (
      <>
        escribiendo a nuestro WhatsApp de atención al cliente{" "}
        <a href={`https://wa.me/${negocio.whatsapp}`} className="font-medium text-brand-700 hover:underline">
          {formatearWhatsapp(negocio.whatsapp)}
        </a>
      </>
    );
  }
  if (negocio.telefono) return <>comunicándote al teléfono {negocio.telefono}</>;
  return <>a través de los canales de atención de {negocio.nombre}</>;
}
