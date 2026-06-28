import { prisma } from "@/lib/prisma";
import { formatearPrecio } from "@/lib/formato";
import { ESTADOS, type EstadoPedido } from "@/lib/pedidos";
import TablaPedidos from "./TablaPedidos";
import SelectorFecha from "./SelectorFecha";

export const dynamic = "force-dynamic";

function fechaBogota(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Bogota" })
  );
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sumarDias(fecha: Date, dias: number): Date {
  const r = new Date(fecha);
  r.setDate(r.getDate() + dias);
  return r;
}

function formatearFechaColombia(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha + "T12:00:00Z") : fecha;
  return d.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Bogota",
  });
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: { fecha?: string; vista?: string; pagina?: string };
}) {
  const hoy = fechaBogota();
  const manana = sumarDias(hoy, 1);
  const vistaActual = searchParams.vista === "todos" ? "todos" : "fecha";
  const fechaSeleccionada = searchParams.fecha || formatDateStr(manana);
  const pagina = Math.max(1, parseInt(searchParams.pagina || "1"));
  const porPagina = 20;

  let pedidos;
  let totalRegistros: number;

  if (vistaActual === "todos") {
    [pedidos, totalRegistros] = await Promise.all([
      prisma.pedidos.findMany({
        include: { cliente: true, ruta: true, items: true },
        orderBy: { created_at: "desc" },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.pedidos.count(),
    ]);
  } else {
    pedidos = await prisma.pedidos.findMany({
      where: { fecha_pedido: new Date(fechaSeleccionada + "T00:00:00.000Z") },
      include: { cliente: true, ruta: true, items: true },
      orderBy: { created_at: "desc" },
    });
    totalRegistros = pedidos.length;
  }

  const contadores: Record<string, number> = { todos: pedidos.length };
  for (const estado of Object.keys(ESTADOS)) {
    contadores[estado] = pedidos.filter((p) => p.estado === estado).length;
  }

  const totalGeneral = pedidos.reduce((sum, p) => sum + Number(p.total), 0);
  const totalPaginas = vistaActual === "todos" ? Math.ceil(totalRegistros / porPagina) : 1;

  const pedidosSerializados = pedidos.map((p) => ({
    id: p.id,
    clienteNombre: p.cliente.nombre,
    clienteCodigo: p.cliente.codigo_mekano,
    rutaNombre: p.ruta?.nombre ?? "Sin ruta",
    numProductos: p.items.length,
    total: formatearPrecio(Number(p.total)),
    totalNum: Number(p.total),
    estado: p.estado as EstadoPedido,
    fechaPedido: formatDateStr(p.fecha_pedido),
    fechaEntrega: p.fecha_pedido.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
    creadoEn: p.created_at.toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" }),
  }));

  const fechaLabel = vistaActual === "todos"
    ? `${totalRegistros} pedidos en total`
    : formatearFechaColombia(fechaSeleccionada);

  const esManana = fechaSeleccionada === formatDateStr(manana);
  const esHoy = fechaSeleccionada === formatDateStr(hoy);

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Pedidos</h1>
        </div>
        <a
          href={`/api/pedidos/exportar?fecha=${fechaSeleccionada}`}
          className="h-11 px-3 lg:px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex items-center gap-2 flex-shrink-0"
          title="Exportar a Excel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="hidden sm:inline">Exportar</span>
        </a>
      </div>

      {/* Toggle vista + date picker */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        {/* Tabs Por fecha / Todos */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <a
            href="/pedidos"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              vistaActual === "fecha"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Por fecha
          </a>
          <a
            href="/pedidos?vista=todos"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              vistaActual === "todos"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Todos
          </a>
        </div>

        {vistaActual === "fecha" && (
          <div className="flex items-center gap-2">
            <SelectorFecha fechaActual={fechaSeleccionada} />
            {!esManana && (
              <a
                href="/pedidos"
                className="h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center"
              >
                Mañana
              </a>
            )}
            {!esHoy && (
              <a
                href={`/pedidos?fecha=${formatDateStr(hoy)}`}
                className="h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center"
              >
                Hoy
              </a>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 sm:ml-auto">
          <span className="text-sm text-gray-500 capitalize">{fechaLabel}</span>
          {totalGeneral > 0 && (
            <span className="text-sm font-semibold text-gray-900">
              Total: {formatearPrecio(totalGeneral)}
            </span>
          )}
        </div>
      </div>

      <TablaPedidos
        pedidos={pedidosSerializados}
        contadores={contadores}
        vistaActual={vistaActual}
      />

      {/* Paginación para vista "todos" */}
      {vistaActual === "todos" && totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {pagina > 1 && (
            <a
              href={`/pedidos?vista=todos&pagina=${pagina - 1}`}
              className="h-10 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center"
            >
              Anterior
            </a>
          )}
          <span className="text-sm text-gray-500">
            Página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas && (
            <a
              href={`/pedidos?vista=todos&pagina=${pagina + 1}`}
              className="h-10 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center"
            >
              Siguiente
            </a>
          )}
        </div>
      )}
    </div>
  );
}
