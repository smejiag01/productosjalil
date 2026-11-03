import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import { formatearFechaHora } from "@/lib/fechas";
import { TRANSICIONES_VALIDAS, esPedidoModificable, type EstadoPedido } from "@/lib/pedidos";
import BadgeEstado from "@/components/BadgeEstado";
import BotonesEstado from "./BotonesEstado";
import CancelarPedido from "./CancelarPedido";
import BotonModificarPedido from "./BotonModificarPedido";
import SeccionProductosPedido from "./SeccionProductosPedido";
import { EdicionPedidoProvider } from "./EdicionPedidoContext";

import { ChevronLeft, MapPin, Phone } from "@/components/ui/icons";
export const dynamic = "force-dynamic";

export default async function DetallePedidoPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const pedido = await prisma.pedidos.findUnique({
    where: { id: params.id },
    include: {
      cliente: { include: { ruta: true } },
      ruta: true,
      sede: true,
      items: { include: { producto: true } },
    },
  });

  if (!pedido) notFound();

  const estado = pedido.estado as EstadoPedido;
  const transicionesDisponibles = TRANSICIONES_VALIDAS[estado] ?? [];
  const totalPedido = Number(pedido.total);
  const numeroPedido = `PED-${pedido.id.substring(0, 4).toUpperCase()}`;
  const puedeCancelar = transicionesDisponibles.includes("cancelado");
  const puedeModificar = esPedidoModificable(estado);

  const itemsSerializados = pedido.items.map((item) => ({
    key: item.id,
    id: item.id,
    producto_id: item.producto_id,
    producto_nombre: item.producto_nombre,
    unidad: item.producto?.unidad ?? "",
    cantidad: Number(item.cantidad),
    precio_unitario: Number(item.precio_unitario),
  }));

  return (
    <EdicionPedidoProvider>
    <div>
      <div className="mb-6">
        <Link
          href="/pedidos"
          className="text-sm text-ink-500 hover:text-ink-700 transition-colors flex items-center gap-1 mb-3"
        >
          <ChevronLeft aria-hidden="true" className="w-4 h-4" />
          Pedidos del día
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-ink-900">
              Pedido {numeroPedido}
            </h1>
            <BadgeEstado estado={estado} />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {puedeModificar && <BotonModificarPedido />}
            <BotonesEstado
              pedidoId={pedido.id}
              transiciones={transicionesDisponibles}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-card border border-ink-200 shadow-card p-4 sm:p-6">
          <h3 className="text-xs font-medium text-ink-600 uppercase tracking-wider mb-4">Cliente</h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-sm flex-shrink-0">
              {pedido.cliente.nombre.split(" ").map((p) => p[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            <div className="space-y-2 min-w-0">
              <div>
                <p className="font-semibold text-ink-900">{pedido.cliente.nombre}</p>
                {pedido.cliente.codigo_mekano && <p className="text-xs text-ink-500">Código: {pedido.cliente.codigo_mekano}</p>}
              </div>
              {pedido.cliente.telefono && (
                <div className="flex items-center gap-2 text-sm text-ink-700">
                  <Phone aria-hidden="true" className="w-4 h-4 text-ink-500 flex-shrink-0" />
                  <span className="truncate">{pedido.cliente.telefono}</span>
                </div>
              )}
              {pedido.sede ? (
                <div className="flex items-start gap-2 text-sm text-ink-700">
                  <MapPin aria-hidden="true" className="w-4 h-4 text-ink-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-medium text-ink-800">Sede {pedido.sede.nombre_sede}</span>
                    {pedido.sede.direccion && <>{" — "}{pedido.sede.direccion}</>}
                  </span>
                </div>
              ) : pedido.cliente.direccion ? (
                <div className="flex items-start gap-2 text-sm text-ink-700">
                  <MapPin aria-hidden="true" className="w-4 h-4 text-ink-500 mt-0.5 flex-shrink-0" />
                  <span>{pedido.cliente.direccion}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-card border border-ink-200 shadow-card p-4 sm:p-6">
          <h3 className="text-xs font-medium text-ink-600 uppercase tracking-wider mb-4">Datos del pedido</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-600">Entrega</span>
              <span className="text-ink-900 font-semibold capitalize">
                {pedido.fecha_pedido.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
              </span>
            </div>
            <div className="flex justify-between text-sm"><span className="text-ink-600">Creado</span><span className="text-ink-900 font-medium">{formatearFechaHora(pedido.created_at)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-ink-600">Ruta</span><span className="text-ink-900 font-medium">{pedido.ruta?.nombre ?? "Sin ruta"}</span></div>
            <div className="flex justify-between text-sm items-center"><span className="text-ink-600">Estado</span><BadgeEstado estado={estado} /></div>
            {pedido.confirmado_at && <div className="flex justify-between text-sm"><span className="text-ink-600">Confirmado</span><span className="text-ink-900 font-medium">{formatearFechaHora(pedido.confirmado_at)}</span></div>}
            {pedido.notas && <div className="pt-2 border-t border-ink-100"><p className="text-xs text-ink-600 mb-1">Notas</p><p className="text-sm text-ink-800">{pedido.notas}</p></div>}
          </div>
        </div>
      </div>

      {/* Productos — cards en móvil, tabla en desktop; editable si el pedido lo permite */}
      <SeccionProductosPedido
        pedidoId={pedido.id}
        clienteId={pedido.cliente_id}
        itemsIniciales={itemsSerializados}
      />

      {puedeCancelar && (
        <CancelarPedido
          pedidoId={pedido.id}
          numeroPedido={numeroPedido}
          clienteNombre={pedido.cliente.nombre}
          total={formatearPrecio(totalPedido)}
        />
      )}
    </div>
    </EdicionPedidoProvider>
  );
}
