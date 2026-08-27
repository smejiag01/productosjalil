import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatearFechaHora } from "@/lib/fechas";
import { INVENTARIO_MATERIA_PRIMA_HABILITADO } from "@/lib/inventario-flags";
import SeccionReceta from "./SeccionReceta";

export const dynamic = "force-dynamic";

const LABEL_MOTIVO: Record<string, string> = {
  compra: "Compra",
  venta: "Venta",
  merma: "Merma",
  produccion: "Producción",
  ajuste_manual: "Ajuste manual",
  reconteo: "Reconteo",
};

export default async function DetalleProductoTerminadoPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await prisma.inventario_items.findUnique({
    where: { id: params.id },
    include: { producto: { select: { id: true, nombre: true } } },
  });

  if (!item || item.tipo !== "producto_terminado") {
    notFound();
  }

  // El historial de movimientos (quién sale en qué pedido y cuánto) se deja
  // visible siempre, aunque el resto de inventario de materia prima esté
  // oculto — la receta (consume insumos) sí sigue apagada con el flag.
  const movimientos = await prisma.inventario_movimientos.findMany({
    where: { item_id: item.id },
    orderBy: { created_at: "desc" },
    take: 20,
    include: { usuario: { select: { nombre: true } } },
  });

  const idsPedidos = movimientos
    .filter((m) => m.referencia_tipo === "pedido" && m.referencia_id)
    .map((m) => m.referencia_id as string);

  const pedidosRef = idsPedidos.length
    ? await prisma.pedidos.findMany({
        where: { id: { in: idsPedidos } },
        include: { cliente: { select: { nombre: true } } },
      })
    : [];
  const pedidosMap = new Map(pedidosRef.map((p) => [p.id, p]));

  const movimientosSerializados = movimientos.map((m) => {
    const pedidoRef = m.referencia_tipo === "pedido" && m.referencia_id ? pedidosMap.get(m.referencia_id) : null;
    return {
      id: m.id,
      fecha: formatearFechaHora(m.created_at),
      tipo: m.tipo,
      motivo: m.motivo,
      cantidad: Number(m.cantidad),
      cantidadNueva: Number(m.cantidad_nueva),
      usuarioNombre: m.usuario?.nombre ?? null,
      pedido: pedidoRef
        ? { id: pedidoRef.id, numero: `PED-${pedidoRef.id.substring(0, 4).toUpperCase()}`, clienteNombre: pedidoRef.cliente.nombre }
        : null,
    };
  });

  let recetaSerializada: {
    id: string;
    cantidad_requerida: number;
    insumo: { id: string; nombre: string; unidad: string; tipo: string; stock_actual: number };
  }[] = [];
  let disponibles: { id: string; nombre: string; unidad: string; tipo: string }[] = [];

  if (INVENTARIO_MATERIA_PRIMA_HABILITADO) {
    const [receta, items] = await Promise.all([
      prisma.inventario_recetas.findMany({
        where: { producto_terminado_id: item.id, activo: true },
        include: {
          insumo: { select: { id: true, nombre: true, unidad: true, tipo: true, stock_actual: true } },
        },
        orderBy: { created_at: "asc" },
      }),
      prisma.inventario_items.findMany({
        where: { tipo: { in: ["insumo", "materia_prima"] }, activo: true },
        select: { id: true, nombre: true, unidad: true, tipo: true },
        orderBy: { nombre: "asc" },
      }),
    ]);

    recetaSerializada = receta.map((r) => ({
      id: r.id,
      cantidad_requerida: Number(r.cantidad_requerida),
      insumo: {
        id: r.insumo.id,
        nombre: r.insumo.nombre,
        unidad: r.insumo.unidad,
        tipo: r.insumo.tipo,
        stock_actual: Number(r.insumo.stock_actual),
      },
    }));
    disponibles = items;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/inventarios/producto-terminado"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mb-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Producto terminado
        </Link>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{item.nombre}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Stock actual: {Number(item.stock_actual)} {item.unidad}
          {item.producto ? ` · Vinculado a: ${item.producto.nombre}` : ""}
        </p>
      </div>

      {INVENTARIO_MATERIA_PRIMA_HABILITADO && (
        <div className="mb-6 sm:mb-8">
          <SeccionReceta
            productoTerminadoId={item.id}
            recetaInicial={recetaSerializada}
            disponibles={disponibles}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Historial de movimientos</h3>
          <p className="text-xs text-gray-400 mt-0.5">Últimos {movimientosSerializados.length} movimientos de este producto</p>
        </div>

        {movimientosSerializados.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">Sin movimientos registrados aún</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {movimientosSerializados.map((m) => (
              <div key={m.id} className="px-4 sm:px-6 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      m.tipo === "entrada"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : m.tipo === "salida"
                          ? "bg-red-50 border-red-200 text-red-800"
                          : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}>
                      {m.tipo === "entrada" ? "Entrada" : m.tipo === "salida" ? "Salida" : "Ajuste"}
                    </span>
                    <span className="text-sm text-gray-700">{LABEL_MOTIVO[m.motivo] ?? m.motivo}</span>
                    {m.pedido && (
                      <Link href={`/pedidos/${m.pedido.id}`} className="text-xs text-brand hover:text-brand-light font-medium">
                        {m.pedido.numero} — {m.pedido.clienteNombre}
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {m.fecha}{m.usuarioNombre ? ` · ${m.usuarioNombre}` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-medium ${m.tipo === "salida" ? "text-red-600" : "text-gray-900"}`}>
                    {m.tipo === "salida" ? "-" : "+"}{m.cantidad} {item.unidad}
                  </p>
                  <p className="text-xs text-gray-400">Stock: {m.cantidadNueva}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
