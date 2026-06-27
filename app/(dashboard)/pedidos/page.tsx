import { prisma } from "@/lib/prisma";
import { formatearFecha, formatearPrecio } from "@/lib/formato";
import { ESTADOS, type EstadoPedido } from "@/lib/pedidos";
import TablaPedidos from "./TablaPedidos";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const hoy = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Bogota" })
  );
  const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  const pedidos = await prisma.pedidos.findMany({
    where: { fecha_pedido: new Date(fechaStr + "T00:00:00.000Z") },
    include: { cliente: true, ruta: true, items: true },
    orderBy: { created_at: "desc" },
  });

  const contadores: Record<string, number> = { todos: pedidos.length };
  for (const estado of Object.keys(ESTADOS)) {
    contadores[estado] = pedidos.filter((p) => p.estado === estado).length;
  }

  const totalGeneral = pedidos.reduce((sum, p) => sum + Number(p.total), 0);

  const pedidosSerializados = pedidos.map((p) => ({
    id: p.id,
    clienteNombre: p.cliente.nombre,
    clienteCodigo: p.cliente.codigo_mekano,
    rutaNombre: p.ruta?.nombre ?? "Sin ruta",
    numProductos: p.items.length,
    total: formatearPrecio(Number(p.total)),
    estado: p.estado as EstadoPedido,
  }));

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Pedidos del día
            </h1>
            <span className="text-sm text-gray-400">{pedidos.length} pedidos</span>
          </div>
          <p className="text-gray-500 text-sm mt-1 capitalize">{formatearFecha(hoy)}</p>
          <p className="text-sm text-gray-500 mt-1 lg:hidden">
            Total: <span className="font-semibold text-gray-900">{formatearPrecio(totalGeneral)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-gray-500 hidden lg:inline">
            Total estimado: <span className="font-semibold text-gray-900">{formatearPrecio(totalGeneral)}</span>
          </span>
          <a
            href={`/api/pedidos/exportar?fecha=${fechaStr}`}
            className="h-11 px-3 lg:px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex items-center gap-2"
            title="Exportar a Excel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="hidden sm:inline">Exportar</span>
          </a>
        </div>
      </div>

      <TablaPedidos pedidos={pedidosSerializados} contadores={contadores} />
    </div>
  );
}
