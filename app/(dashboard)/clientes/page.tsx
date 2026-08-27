import { prisma } from "@/lib/prisma";
import TablaClientes from "./TablaClientes";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [clientes, rutas, contactos] = await Promise.all([
    prisma.clientes.findMany({
      include: { ruta: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.rutas.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.cliente_contactos.findMany({
      select: { cliente_id: true, verificado: true },
    }),
  ]);

  const contactosPorCliente = new Map<string, { total: number; sinVerificar: number }>();
  for (const c of contactos) {
    const actual = contactosPorCliente.get(c.cliente_id) ?? { total: 0, sinVerificar: 0 };
    actual.total += 1;
    if (!c.verificado) actual.sinVerificar += 1;
    contactosPorCliente.set(c.cliente_id, actual);
  }

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
    numContactos: contactosPorCliente.get(c.id)?.total ?? 0,
    contactosSinVerificar: contactosPorCliente.get(c.id)?.sinVerificar ?? 0,
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
