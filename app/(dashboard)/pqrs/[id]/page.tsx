import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearFechaHora } from "@/lib/fechas";
import BadgeEstadoPqr from "@/components/BadgeEstadoPqr";
import SelectorEstadoPqr from "./SelectorEstadoPqr";

import { ChevronLeft, FileIcon, MapPin, Phone } from "@/components/ui/icons";
export const dynamic = "force-dynamic";

function esImagenUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp)$/i.test(new URL(url).pathname);
}

function nombreArchivo(url: string): string {
  const partes = new URL(url).pathname.split("/");
  return partes[partes.length - 1] || "archivo";
}

export default async function DetallePqrPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const pqr = await prisma.pqr.findUnique({
    where: { id: params.id },
    include: { cliente: { include: { ruta: true } } },
  });

  if (!pqr) notFound();

  const adjuntosRaw = Array.isArray(pqr.adjuntos) ? pqr.adjuntos : [];
  const adjuntos = adjuntosRaw
    .map((a) => (typeof a === "string" ? a : (a as { url?: string })?.url))
    .filter((url): url is string => typeof url === "string" && url.length > 0);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/pqrs"
          className="text-sm text-ink-500 hover:text-ink-700 transition-colors flex items-center gap-1 mb-3"
        >
          <ChevronLeft aria-hidden="true" className="w-4 h-4" />
          PQR&apos;s
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-ink-900">
              PQR-{pqr.id.substring(0, 4).toUpperCase()}
            </h1>
            <BadgeEstadoPqr estado={pqr.estado} />
          </div>
          <SelectorEstadoPqr pqrId={pqr.id} estadoActual={pqr.estado} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Cliente */}
        <div className="bg-white rounded-card border border-ink-200 shadow-card p-4 sm:p-6">
          <h3 className="text-xs font-medium text-ink-600 uppercase tracking-wider mb-4">Cliente</h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-sm flex-shrink-0">
              {(pqr.clienteNombre ?? pqr.cliente?.nombre ?? "?")
                .split(" ")
                .map((p) => p[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <div className="space-y-2 min-w-0">
              <div>
                <p className="font-semibold text-ink-900">{pqr.clienteNombre ?? pqr.cliente?.nombre ?? "Sin nombre"}</p>
                {pqr.cliente?.codigo_mekano && <p className="text-xs text-ink-500">Código: {pqr.cliente.codigo_mekano}</p>}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-700">
                <Phone aria-hidden="true" className="w-4 h-4 text-ink-500 flex-shrink-0" />
                <span className="truncate">{pqr.telefono}</span>
              </div>
              {pqr.cliente?.direccion && (
                <div className="flex items-start gap-2 text-sm text-ink-700">
                  <MapPin aria-hidden="true" className="w-4 h-4 text-ink-500 mt-0.5 flex-shrink-0" />
                  <span>{pqr.cliente.direccion}</span>
                </div>
              )}
              {pqr.cliente?.ruta && (
                <p className="text-xs text-ink-500">Ruta: {pqr.cliente.ruta.nombre}</p>
              )}
            </div>
          </div>
        </div>

        {/* Datos del PQR */}
        <div className="bg-white rounded-card border border-ink-200 shadow-card p-4 sm:p-6">
          <h3 className="text-xs font-medium text-ink-600 uppercase tracking-wider mb-4">Datos del PQR</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-600">Recibido</span>
              <span className="text-ink-900 font-medium">
                {formatearFechaHora(pqr.createdAt)}
              </span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-ink-600">Estado</span>
              <BadgeEstadoPqr estado={pqr.estado} />
            </div>
            {pqr.updatedAt.getTime() !== pqr.createdAt.getTime() && (
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Última actualización</span>
                <span className="text-ink-900 font-medium">
                  {formatearFechaHora(pqr.updatedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Texto del PQR */}
      <div className="bg-white rounded-card border border-ink-200 shadow-card p-4 sm:p-6 mb-6">
        <h3 className="text-xs font-medium text-ink-600 uppercase tracking-wider mb-3">Texto de la solicitud</h3>
        <p className="text-sm text-ink-800 whitespace-pre-wrap">
          {pqr.texto || "El cliente no escribió texto adicional."}
        </p>
      </div>

      {/* Adjuntos */}
      <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-ink-100 flex items-center justify-between">
          <h3 className="font-semibold text-ink-900">Evidencia adjunta</h3>
          <span className="text-sm text-ink-500">{adjuntos.length} archivo{adjuntos.length === 1 ? "" : "s"}</span>
        </div>

        {adjuntos.length === 0 ? (
          <div className="py-10 text-center text-ink-500 text-sm">Sin archivos adjuntos</div>
        ) : (
          <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {adjuntos.map((url, i) => {
              const esImagen = esImagenUrl(url);
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group border border-ink-200 rounded-lg overflow-hidden hover:border-brand/50 transition-colors"
                >
                  {esImagen ? (
                    <div className="aspect-square bg-ink-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Adjunto ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-ink-50 flex flex-col items-center justify-center gap-2 p-3">
                      <FileIcon aria-hidden="true" className="w-8 h-8 text-ink-500" />
                      <span className="text-xs text-ink-600 text-center truncate w-full px-1">{nombreArchivo(url)}</span>
                    </div>
                  )}
                  <div className="px-2 py-1.5 text-center text-xs text-brand group-hover:underline">
                    {esImagen ? "Ver imagen" : "Descargar"}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
