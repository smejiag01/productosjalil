import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearPrecio, formatearFechaCorta } from "@/lib/formato";
import BadgeEstado from "@/components/BadgeEstado";
import TablaPrecios from "./TablaPrecios";
import AccionesCliente from "./AccionesCliente";

export const dynamic = "force-dynamic";

export default async function DetalleClientePage({
  params,
}: {
  params: { id: string };
}) {
  const [cliente, productos, pedidos, rutas] = await Promise.all([
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
    prisma.rutas.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  if (!cliente) notFound();

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
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mb-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Clientes
      </Link>

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-lg">
            {cliente.nombre
              .split(" ")
              .map((p) => p[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {cliente.nombre}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  cliente.activo
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    cliente.activo ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                {cliente.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            {cliente.codigo_mekano && (
              <p className="text-sm text-gray-400">
                Código Mekano: {cliente.codigo_mekano}
              </p>
            )}
          </div>
        </div>
        <AccionesCliente
          cliente={{
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            codigo_mekano: cliente.codigo_mekano,
            ruta_id: cliente.ruta_id,
            activo: cliente.activo,
            notas: cliente.notas,
          }}
          rutas={rutas.map((r) => ({ id: r.id, nombre: r.nombre }))}
        />
      </div>

      {/* Info del cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Contacto
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {cliente.telefono}
          </div>
          {cliente.direccion && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {cliente.direccion}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Ruta
          </h3>
          <p className="text-sm text-gray-700 font-medium">
            {cliente.ruta?.nombre ?? "Sin ruta asignada"}
          </p>
          {cliente.ruta?.descripcion && (
            <p className="text-xs text-gray-400">
              {cliente.ruta.descripcion}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Precios personalizados
          </h3>
          <p className="text-2xl font-bold text-brand">
            {cliente.precios_cliente.length}
          </p>
          <p className="text-xs text-gray-400">
            de {productos.length} productos activos
          </p>
        </div>
      </div>

      {/* Precios personalizados */}
      <div className="mb-8">
        <TablaPrecios
          clienteId={cliente.id}
          productos={productosConPrecios}
        />
      </div>

      {/* Historial de pedidos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Últimos pedidos</h3>
        </div>
        {pedidos.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">Este cliente no tiene pedidos aún</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Ruta
                </th>
                <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pedidos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-6 text-sm text-gray-700">
                    {formatearFechaCorta(p.created_at)}
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-600">
                    {p.ruta?.nombre ?? "—"}
                  </td>
                  <td className="py-3 px-6 text-sm font-medium text-gray-900 text-right">
                    {formatearPrecio(Number(p.total))}
                  </td>
                  <td className="py-3 px-6">
                    <BadgeEstado estado={p.estado} />
                  </td>
                  <td className="py-3 px-6 text-right">
                    <Link
                      href={`/pedidos/${p.id}`}
                      className="text-sm text-brand hover:text-brand-light font-medium"
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
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <h3 className="text-xs font-medium text-yellow-700 uppercase tracking-wider mb-2">
            Notas internas
          </h3>
          <p className="text-sm text-yellow-800">{cliente.notas}</p>
        </div>
      )}
    </div>
  );
}
