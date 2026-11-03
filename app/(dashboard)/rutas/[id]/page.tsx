import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import OrdenClientesRuta from "./OrdenClientesRuta";

import { ChevronLeft } from "@/components/ui/icons";
export const dynamic = "force-dynamic";

export default async function RutaDetallePage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
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
        <Link href="/rutas" className="text-sm text-ink-600 hover:text-ink-800 flex items-center gap-1 mb-2">
          <ChevronLeft aria-hidden="true" className="w-4 h-4" />
          Rutas
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">{ruta.nombre}</h1>
        <p className="text-ink-600 text-sm mt-1">
          {ruta.empleado?.nombre || "Sin repartidor asignado"} · {clientesSerializados.length} clientes
        </p>
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink-900">Orden de entrega</h2>
        <p className="text-xs text-ink-600 mt-0.5">
          Define el orden en que el repartidor visitará a los clientes de esta ruta.
        </p>
      </div>

      <OrdenClientesRuta clientesIniciales={clientesSerializados} />
    </div>
  );
}
