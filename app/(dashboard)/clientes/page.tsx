import { prisma } from "@/lib/prisma";
import TablaClientes from "./TablaClientes";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [clientes, rutas] = await Promise.all([
    prisma.clientes.findMany({
      include: { ruta: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.rutas.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const contadores = {
    todos: clientes.length,
    activos: clientes.filter((c) => c.activo).length,
    inactivos: clientes.filter((c) => !c.activo).length,
  };

  const clientesSerializados = clientes.map((c) => ({
    id: c.id,
    codigo_mekano: c.codigo_mekano,
    nombre: c.nombre,
    telefono: c.telefono,
    direccion: c.direccion,
    rutaNombre: c.ruta?.nombre ?? null,
    ruta_id: c.ruta_id,
    activo: c.activo,
  }));

  const rutasSerializadas = rutas.map((r) => ({
    id: r.id,
    nombre: r.nombre,
  }));

  return (
    <TablaClientes
      clientes={clientesSerializados}
      rutas={rutasSerializadas}
      contadores={contadores}
    />
  );
}
