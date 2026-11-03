import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hoyStr, toDbDate } from "@/lib/analiticas/periodos";
import { resolverFecha } from "@/lib/repartidor-fechas";
import ListaEntregas from "./ListaEntregas";
import NavegadorDias from "./NavegadorDias";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mis entregas" };

// En "Todos los días" se muestran las más recientes hasta este tope.
const LIMITE_TODOS = 300;

export default async function RepartidorPage(props: {
  searchParams: Promise<{ fecha?: string; vista?: string }>;
}) {
  const searchParams = await props.searchParams;
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
  const modo: "dia" | "todos" = searchParams.vista === "todos" ? "todos" : "dia";
  const fecha = resolverFecha(searchParams.fecha, hoy);

  const pedidos =
    rutaIds.length === 0
      ? []
      : await prisma.pedidos.findMany({
          where: {
            ruta_id: { in: rutaIds },
            estado: { not: "cancelado" },
            // Por día: solo esa fecha. Todos los días: sin filtro de fecha.
            ...(modo === "dia" ? { fecha_pedido: toDbDate(fecha) } : {}),
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
          ...(modo === "todos"
            ? { orderBy: { fecha_pedido: "desc" as const }, take: LIMITE_TODOS }
            : {}),
        });

  const ordenados = pedidos.sort((a, b) => {
    // Más reciente primero cuando se ven todos los días
    if (modo === "todos" && a.fecha_pedido.getTime() !== b.fecha_pedido.getTime()) {
      return b.fecha_pedido.getTime() - a.fecha_pedido.getTime();
    }
    const oa = a.cliente.orden_ruta ?? Number.MAX_SAFE_INTEGER;
    const ob = b.cliente.orden_ruta ?? Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    return a.cliente.nombre.localeCompare(b.cliente.nombre);
  });

  const entregas = ordenados.map((p) => {
    // Sede de entrega: la del pedido si quedó vinculada, si no la principal del cliente
    const sedeEntrega = p.sede ?? p.cliente.sedes[0] ?? null;
    const usaUbicacionCliente = !sedeEntrega || sedeEntrega.es_principal;

    return {
      id: p.id,
      fecha: p.fecha_pedido.toISOString().slice(0, 10),
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
        // Sin sede, o en la principal, vale la ubicación fijada en el cliente
        latitud: sedeEntrega?.latitud ?? (usaUbicacionCliente ? p.cliente.latitud : null),
        longitud: sedeEntrega?.longitud ?? (usaUbicacionCliente ? p.cliente.longitud : null),
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
        <h1 className="font-display text-2xl font-semibold text-ink-900">Mis entregas</h1>
      </div>

      {rutaIds.length === 0 ? (
        <div className="rounded-card border border-ink-200 bg-white px-4 py-16 text-center">
          <p className="text-sm text-ink-700">Aún no tienes rutas asignadas.</p>
          <p className="mt-1 text-xs text-ink-600">Pídele al administrador que te asigne una ruta.</p>
        </div>
      ) : (
        <>
          <NavegadorDias modo={modo} fecha={fecha} hoy={hoy} />
          <ListaEntregas
            entregas={entregas}
            modo={modo}
            hoy={hoy}
            truncado={modo === "todos" && entregas.length >= LIMITE_TODOS}
          />
        </>
      )}
    </div>
  );
}
