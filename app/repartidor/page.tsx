import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hoyStr, toDbDate } from "@/lib/analiticas/periodos";
import ListaEntregas from "./ListaEntregas";

export const dynamic = "force-dynamic";

export default async function RepartidorPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.rol !== "repartidor") {
    redirect("/");
  }

  const rutas = await prisma.rutas.findMany({
    where: { repartidor_id: session.user.id },
    select: { id: true, nombre: true },
  });
  const rutaIds = rutas.map((r) => r.id);
  const nombreRuta = new Map(rutas.map((r) => [r.id, r.nombre]));

  const hoy = hoyStr();

  const pedidos = rutaIds.length === 0
    ? []
    : await prisma.pedidos.findMany({
        where: {
          fecha_pedido: toDbDate(hoy),
          ruta_id: { in: rutaIds },
          estado: { not: "cancelado" },
        },
        include: {
          cliente: {
            include: {
              sedes: { where: { es_principal: true }, take: 1 },
            },
          },
          sede: true,
          items: true,
        },
      });

  const ordenados = pedidos.sort((a, b) => {
    const oa = a.cliente.orden_ruta ?? Number.MAX_SAFE_INTEGER;
    const ob = b.cliente.orden_ruta ?? Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    return a.cliente.nombre.localeCompare(b.cliente.nombre);
  });

  const entregas = ordenados.map((p) => {
    // Sede de entrega: la del pedido si quedó vinculada, si no la principal del cliente
    const sedeEntrega = p.sede ?? p.cliente.sedes[0] ?? null;

    return {
      id: p.id,
      estado: p.estado,
      total: Number(p.total),
      notas: p.notas,
      rutaId: p.ruta_id as string,
      rutaNombre: nombreRuta.get(p.ruta_id as string) ?? "Sin nombre",
      cliente: {
        nombre: p.cliente.nombre,
        telefono: p.cliente.telefono,
        sedeNombre: sedeEntrega?.nombre_sede ?? null,
        direccion: sedeEntrega?.direccion ?? p.cliente.direccion,
        latitud: sedeEntrega?.latitud ?? null,
        longitud: sedeEntrega?.longitud ?? null,
      },
      items: p.items.map((i) => ({
        id: i.id,
        nombre: i.producto_nombre,
        cantidad: Number(i.cantidad),
      })),
    };
  });

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">Mis entregas de hoy</h1>
        <p className="text-sm text-gray-500 capitalize">
          {(() => {
            const [y, m, d] = hoy.split("-").map(Number);
            return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            });
          })()}
        </p>
      </div>

      {rutaIds.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400 px-4">
          <p className="text-sm">Aún no tienes rutas asignadas.</p>
          <p className="text-xs text-gray-300 mt-1">Pídele al administrador que te asigne una ruta.</p>
        </div>
      ) : (
        <ListaEntregas entregas={entregas} />
      )}
    </div>
  );
}
