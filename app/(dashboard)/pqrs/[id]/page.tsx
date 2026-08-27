import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearFechaHora } from "@/lib/fechas";
import BadgeEstadoPqr from "@/components/BadgeEstadoPqr";
import SelectorEstadoPqr from "./SelectorEstadoPqr";

export const dynamic = "force-dynamic";

function esImagenUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp)$/i.test(new URL(url).pathname);
}

function nombreArchivo(url: string): string {
  const partes = new URL(url).pathname.split("/");
  return partes[partes.length - 1] || "archivo";
}

export default async function DetallePqrPage({ params }: { params: { id: string } }) {
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
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mb-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          PQR&apos;s
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              PQR-{pqr.id.substring(0, 4).toUpperCase()}
            </h1>
            <BadgeEstadoPqr estado={pqr.estado} />
          </div>
          <SelectorEstadoPqr pqrId={pqr.id} estadoActual={pqr.estado} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Cliente */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Cliente</h3>
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
                <p className="font-semibold text-gray-900">{pqr.clienteNombre ?? pqr.cliente?.nombre ?? "Sin nombre"}</p>
                {pqr.cliente?.codigo_mekano && <p className="text-xs text-gray-400">Código: {pqr.cliente.codigo_mekano}</p>}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                <span className="truncate">{pqr.telefono}</span>
              </div>
              {pqr.cliente?.direccion && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span>{pqr.cliente.direccion}</span>
                </div>
              )}
              {pqr.cliente?.ruta && (
                <p className="text-xs text-gray-400">Ruta: {pqr.cliente.ruta.nombre}</p>
              )}
            </div>
          </div>
        </div>

        {/* Datos del PQR */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Datos del PQR</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Recibido</span>
              <span className="text-gray-900 font-medium">
                {formatearFechaHora(pqr.createdAt)}
              </span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Estado</span>
              <BadgeEstadoPqr estado={pqr.estado} />
            </div>
            {pqr.updatedAt.getTime() !== pqr.createdAt.getTime() && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Última actualización</span>
                <span className="text-gray-900 font-medium">
                  {formatearFechaHora(pqr.updatedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Texto del PQR */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Texto de la solicitud</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {pqr.texto || "El cliente no escribió texto adicional."}
        </p>
      </div>

      {/* Adjuntos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Evidencia adjunta</h3>
          <span className="text-sm text-gray-400">{adjuntos.length} archivo{adjuntos.length === 1 ? "" : "s"}</span>
        </div>

        {adjuntos.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">Sin archivos adjuntos</div>
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
                  className="group border border-gray-200 rounded-lg overflow-hidden hover:border-brand/50 transition-colors"
                >
                  {esImagen ? (
                    <div className="aspect-square bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Adjunto ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-50 flex flex-col items-center justify-center gap-2 p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="text-xs text-gray-500 text-center truncate w-full px-1">{nombreArchivo(url)}</span>
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
