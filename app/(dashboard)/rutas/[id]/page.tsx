import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import OrdenClientesRuta from "./OrdenClientesRuta";

export const dynamic = "force-dynamic";

export default async function RutaDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const ruta = await prisma.rutas.findUnique({
    where: { id: params.id },
    include: {
      empleado: { select: { id: true, nombre: true } },
      clientes: {
        select: { id: true, nombre: true, direccion: true, orden_ruta: true, activo: true },
        orderBy: [{ orden_ruta: "asc" }, { nombre: "asc" }],
      },
    },
  });

  if (!ruta) notFound();

  const clientesSerializados = ruta.clientes.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    direccion: c.direccion,
    orden_ruta: c.orden_ruta,
    activo: c.activo,
  }));

  return (
    <div>
      <div className="mb-6">
        <Link href="/rutas" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Rutas
        </Link>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{ruta.nombre}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {ruta.empleado?.nombre || "Sin repartidor asignado"} · {clientesSerializados.length} clientes
        </p>
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Orden de entrega</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Define el orden en que el repartidor visitará a los clientes de esta ruta.
        </p>
      </div>

      <OrdenClientesRuta clientesIniciales={clientesSerializados} />
    </div>
  );
}
