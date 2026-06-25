import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearPrecio, formatearFechaCorta } from "@/lib/formato";
import { TRANSICIONES_VALIDAS, type EstadoPedido } from "@/lib/pedidos";
import BadgeEstado from "@/components/BadgeEstado";
import BotonesEstado from "./BotonesEstado";

export const dynamic = "force-dynamic";

export default async function DetallePedidoPage({
  params,
}: {
  params: { id: string };
}) {
  const pedido = await prisma.pedidos.findUnique({
    where: { id: params.id },
    include: {
      cliente: { include: { ruta: true } },
      ruta: true,
      items: { include: { producto: true } },
    },
  });

  if (!pedido) notFound();

  const estado = pedido.estado as EstadoPedido;
  const transicionesDisponibles = TRANSICIONES_VALIDAS[estado] ?? [];
  const totalPedido = Number(pedido.total);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/pedidos"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mb-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Pedidos del día
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Pedido PED-{pedido.id.substring(0, 4).toUpperCase()}
            </h1>
            <BadgeEstado estado={estado} />
          </div>
          <BotonesEstado
            pedidoId={pedido.id}
            transiciones={transicionesDisponibles}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Cliente</h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-sm flex-shrink-0">
              {pedido.cliente.nombre.split(" ").map((p) => p[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            <div className="space-y-2 min-w-0">
              <div>
                <p className="font-semibold text-gray-900">{pedido.cliente.nombre}</p>
                {pedido.cliente.codigo_mekano && <p className="text-xs text-gray-400">Código: {pedido.cliente.codigo_mekano}</p>}
              </div>
              {pedido.cliente.telefono && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  <span className="truncate">{pedido.cliente.telefono}</span>
                </div>
              )}
              {pedido.cliente.direccion && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span>{pedido.cliente.direccion}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Datos del pedido</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Fecha</span><span className="text-gray-900 font-medium">{formatearFechaCorta(pedido.created_at)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Ruta</span><span className="text-gray-900 font-medium">{pedido.ruta?.nombre ?? "Sin ruta"}</span></div>
            <div className="flex justify-between text-sm items-center"><span className="text-gray-500">Estado</span><BadgeEstado estado={estado} /></div>
            {pedido.confirmado_at && <div className="flex justify-between text-sm"><span className="text-gray-500">Confirmado</span><span className="text-gray-900 font-medium">{formatearFechaCorta(pedido.confirmado_at)}</span></div>}
            {pedido.notas && <div className="pt-2 border-t border-gray-100"><p className="text-xs text-gray-500 mb-1">Notas</p><p className="text-sm text-gray-700">{pedido.notas}</p></div>}
          </div>
        </div>
      </div>

      {/* Productos — cards en móvil, tabla en desktop */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Productos del pedido</h3>
          <span className="text-sm text-gray-400">{pedido.items.length} productos</span>
        </div>

        {/* Cards móvil */}
        <div className="md:hidden divide-y divide-gray-50">
          {pedido.items.map((item) => (
            <div key={item.id} className="p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">{item.producto_nombre}</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{Number(item.cantidad)} {item.producto?.unidad ?? ""}</span>
                <span>{formatearPrecio(Number(item.precio_unitario))}/{item.producto?.unidad ?? ""}</span>
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-sm font-medium text-gray-900">{formatearPrecio(Number(item.subtotal))}</span>
              </div>
            </div>
          ))}
          <div className="p-4 flex justify-between items-center border-t-2 border-gray-200">
            <span className="text-sm font-medium text-gray-500">Total</span>
            <span className="text-xl font-bold text-brand">{formatearPrecio(totalPedido)}</span>
          </div>
        </div>

        {/* Tabla desktop */}
        <table className="w-full hidden md:table">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Precio unitario</th>
              <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pedido.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 px-6"><div className="flex items-center gap-2"><span className="text-gray-400">•</span><span className="text-sm font-medium text-gray-900">{item.producto_nombre}</span></div></td>
                <td className="py-3 px-6 text-sm text-gray-600">{Number(item.cantidad)} {item.producto?.unidad ?? ""}</td>
                <td className="py-3 px-6 text-sm text-gray-600 text-right">{formatearPrecio(Number(item.precio_unitario))}{item.producto?.unidad ? `/${item.producto.unidad}` : ""}</td>
                <td className="py-3 px-6 text-sm font-medium text-gray-900 text-right">{formatearPrecio(Number(item.subtotal))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <td colSpan={3} className="py-4 px-6 text-right text-sm font-medium text-gray-500">Total</td>
              <td className="py-4 px-6 text-right text-xl font-bold text-brand">{formatearPrecio(totalPedido)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
