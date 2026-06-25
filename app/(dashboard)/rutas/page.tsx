import { prisma } from "@/lib/prisma";
import TablaRutas from "./TablaRutas";

export const dynamic = "force-dynamic";

export default async function RutasPage() {
  const [rutas, empleados] = await Promise.all([
    prisma.rutas.findMany({
      include: {
        empleado: { select: { id: true, nombre: true } },
        _count: { select: { clientes: true } },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.empleados.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

  const rutasSerializadas = rutas.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion,
    dia_semana: r.dia_semana,
    empleado: r.empleado,
    activa: r.activa,
    num_clientes: r._count.clientes,
  }));

  return (
    <TablaRutas
      rutas={rutasSerializadas}
      empleados={empleados}
    />
  );
}
