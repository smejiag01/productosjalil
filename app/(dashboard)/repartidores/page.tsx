import { prisma } from "@/lib/prisma";
import TablaRepartidores from "./TablaRepartidores";

export const dynamic = "force-dynamic";

export default async function RepartidoresPage() {
  const [repartidores, rutas] = await Promise.all([
    prisma.usuarios.findMany({
      where: { rol: "repartidor" },
      select: {
        id: true,
        nombre: true,
        correo: true,
        activo: true,
        rutas_asignadas: { select: { id: true, nombre: true } },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.rutas.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return <TablaRepartidores repartidores={repartidores} rutas={rutas} />;
}
