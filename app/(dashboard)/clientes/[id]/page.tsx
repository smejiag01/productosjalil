import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import { formatearFechaHora } from "@/lib/fechas";
import BadgeEstado from "@/components/BadgeEstado";
import TablaPrecios from "./TablaPrecios";
import AccionesCliente from "./AccionesCliente";
import SeccionSedes from "./SeccionSedes";
import SeccionContactos from "./SeccionContactos";

import { ChevronLeft, MapPin, Phone } from "@/components/ui/icons";
export const dynamic = "force-dynamic";

export default async function DetalleClientePage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const [cliente, productos, pedidos, totalPedidos, totalPqrs, rutas, sedes, contactos] = await Promise.all([
    prisma.clientes.findUnique({
      where: { id: params.id },
      include: {
        ruta: true,
        precios_cliente: {
          include: { producto: true },
        },
      },
    }),
    prisma.productos.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    }),
    prisma.pedidos.findMany({
      where: { cliente_id: params.id },
      orderBy: { created_at: "desc" },
      take: 5,
      include: { ruta: true },
    }),
    prisma.pedidos.count({ where: { cliente_id: params.id } }),
    prisma.pqr.count({ where: { clienteId: params.id } }),
    prisma.rutas.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.sedes.findMany({
      where: { cliente_id: params.id },
      orderBy: [{ es_principal: "desc" }, { nombre_sede: "asc" }],
    }),
    prisma.cliente_contactos.findMany({
      where: { cliente_id: params.id },
      orderBy: [{ principal: "desc" }, { created_at: "asc" }],
    }),
  ]);

  if (!cliente) notFound();

  const sedesSerializadas = sedes.map((s) => ({
    id: s.id,
    nombre_sede: s.nombre_sede,
    direccion: s.direccion,
    latitud: s.latitud,
    longitud: s.longitud,
    es_principal: s.es_principal,
    activa: s.activa,
  }));

  const contactosSerializados = contactos.map((c) => ({
    id: c.id,
    telefono: c.telefono,
    nombre: c.nombre,
    principal: c.principal,
    verificado: c.verificado,
    origen: c.origen,
  }));

  const preciosMap = new Map(
    cliente.precios_cliente.map((pc) => [pc.producto_id, Number(pc.precio)])
  );

  const productosConPrecios = productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    unidad: p.unidad,
    precio_base: Number(p.precio_base),
    precio_cliente: preciosMap.get(p.id) ?? null,
  }));

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        href="/clientes"
        className="text-sm text-ink-500 hover:text-ink-700 transition-colors flex items-center gap-1 mb-3"
      >
        <ChevronLeft aria-hidden="true" className="w-4 h-4" />
        Clientes
      </Link>

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 sm:w-14 h-12 sm:h-14 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-base sm:text-lg flex-shrink-0">
            {cliente.nombre
              .split(" ")
              .map((p) => p[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-ink-900">
                {cliente.nombre}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  cliente.activo
                    ? "bg-ok-soft border-ok/30 text-ok"
                    : "bg-danger-soft border-danger/30 text-danger"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    cliente.activo ? "bg-ok" : "bg-danger"
                  }`}
                />
                {cliente.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            {cliente.razon_social && (
              <p className="text-sm text-ink-600">{cliente.razon_social}</p>
            )}
            {cliente.codigo_mekano && (
              <p className="text-sm text-ink-500">
                Código Mekano: {cliente.codigo_mekano}
              </p>
            )}
            {cliente.nit && (
              <p className="text-sm text-ink-500">NIT: {cliente.nit}</p>
            )}
          </div>
        </div>
        <AccionesCliente
          cliente={{
            id: cliente.id,
            nombre: cliente.nombre,
            razon_social: cliente.razon_social,
            nit: cliente.nit,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            latitud: cliente.latitud,
            longitud: cliente.longitud,
            codigo_mekano: cliente.codigo_mekano,
            ruta_id: cliente.ruta_id,
            activo: cliente.activo,
            notas: cliente.notas,
          }}
          rutas={rutas.map((r) => ({ id: r.id, nombre: r.nombre }))}
          puedeEliminar={totalPedidos === 0 && totalPqrs === 0}
        />
      </div>

      {/* Info del cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-card border border-ink-200 shadow-card p-5 space-y-3">
          <h3 className="text-xs font-medium text-ink-600 uppercase tracking-wider">
            Contacto
          </h3>
          <div className="flex items-center gap-2 text-sm text-ink-800">
            <Phone aria-hidden="true" className="w-4 h-4 text-ink-500" />
            {cliente.telefono}
          </div>
          {cliente.direccion && (
            <div className="flex items-start gap-2 text-sm text-ink-800">
              <MapPin aria-hidden="true" className="w-4 h-4 text-ink-500 mt-0.5" />
              {cliente.direccion}
            </div>
          )}
        </div>

        <div className="bg-white rounded-card border border-ink-200 shadow-card p-5 space-y-3">
          <h3 className="text-xs font-medium text-ink-600 uppercase tracking-wider">
            Ruta
          </h3>
          <p className="text-sm text-ink-800 font-medium">
            {cliente.ruta?.nombre ?? "Sin ruta asignada"}
          </p>
          {cliente.ruta?.descripcion && (
            <p className="text-xs text-ink-500">
              {cliente.ruta.descripcion}
            </p>
          )}
        </div>

        <div className="bg-white rounded-card border border-ink-200 shadow-card p-5 space-y-3">
          <h3 className="text-xs font-medium text-ink-600 uppercase tracking-wider">
            Precios personalizados
          </h3>
          <p className="text-2xl font-bold text-brand">
            {cliente.precios_cliente.length}
          </p>
          <p className="text-xs text-ink-500">
            de {productos.length} productos activos
          </p>
        </div>
      </div>

      {/* Contactos */}
      <div className="mb-6 sm:mb-8">
        <SeccionContactos clienteId={cliente.id} contactosIniciales={contactosSerializados} />
      </div>

      {/* Sedes */}
      <div className="mb-6 sm:mb-8">
        <SeccionSedes clienteId={cliente.id} sedesIniciales={sedesSerializadas} />
      </div>

      {/* Precios personalizados */}
      <div className="mb-8">
        <TablaPrecios
          clienteId={cliente.id}
          productos={productosConPrecios}
        />
      </div>

      {/* Historial de pedidos */}
      <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-ink-100">
          <h3 className="font-semibold text-ink-900">Últimos pedidos</h3>
        </div>
        {pedidos.length === 0 ? (
          <div className="py-12 text-center text-ink-500">
            <p className="text-sm">Este cliente no tiene pedidos aún</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="text-left py-3 px-6 text-xs font-medium text-ink-600 uppercase">
                  Fecha
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-ink-600 uppercase">
                  Ruta
                </th>
                <th className="text-right py-3 px-6 text-xs font-medium text-ink-600 uppercase">
                  Total
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-ink-600 uppercase">
                  Estado
                </th>
                <th className="text-right py-3 px-6 text-xs font-medium text-ink-600 uppercase">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {pedidos.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50/50">
                  <td className="py-3 px-6 text-sm text-ink-800">
                    {formatearFechaHora(p.created_at)}
                  </td>
                  <td className="py-3 px-6 text-sm text-ink-700">
                    {p.ruta?.nombre ?? "—"}
                  </td>
                  <td className="py-3 px-6 text-sm font-medium text-ink-900 text-right">
                    {formatearPrecio(Number(p.total))}
                  </td>
                  <td className="py-3 px-6">
                    <BadgeEstado estado={p.estado} />
                  </td>
                  <td className="py-3 px-6 text-right">
                    <Link
                      href={`/pedidos/${p.id}`}
                      className="text-sm text-brand hover:text-brand-700 font-medium"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notas */}
      {cliente.notas && (
        <div className="mt-6 bg-warn-soft border border-warn/30 rounded-card p-5">
          <h3 className="text-xs font-medium text-warn-soft-text uppercase tracking-wider mb-2">
            Notas internas
          </h3>
          <p className="text-sm text-warn-soft-text">{cliente.notas}</p>
        </div>
      )}
    </div>
  );
}
