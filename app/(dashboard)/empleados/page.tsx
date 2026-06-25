import { prisma } from "@/lib/prisma";
import TablaEmpleados from "./TablaEmpleados";

export const dynamic = "force-dynamic";

export default async function EmpleadosPage() {
  const empleados = await prisma.empleados.findMany({
    orderBy: { nombre: "asc" },
  });

  const serializados = empleados.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    cargo: e.cargo,
    telefono: e.telefono,
    activo: e.activo,
  }));

  return <TablaEmpleados empleados={serializados} />;
}
