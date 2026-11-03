import { redirect } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { ChevronLeft, MapPin } from "@/components/ui/icons";
import { prisma } from "@/lib/prisma";
import { leerCarritoCookie, obtenerClienteSesion } from "@/lib/tienda-auth";
import { precioEfectivo } from "@/lib/precios";
import { proximasFechasEntrega } from "@/lib/fechas-entrega";
import CarritoCliente, {
  type LineaHidratada,
  type FechaOpcion,
  type SedeOpcion,
} from "./CarritoCliente";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tu pedido" };

function etiquetaFecha(fechaStr: string): string {
  const [y, m, d] = fechaStr.split("-").map(Number);
  const fecha = new Date(Date.UTC(y, m - 1, d));
  const texto = fecha.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const NOMBRES_DIA = [
  "domingos",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábados",
];

function etiquetaDiasRuta(dias: number[]): string {
  const nombres = [...dias]
    .sort((a, b) => a - b)
    .map((d) => NOMBRES_DIA[d])
    .filter(Boolean);
  if (nombres.length === 0) return "";
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

export default async function CarritoPage() {
  const cliente = await obtenerClienteSesion();
  if (!cliente) redirect("/tienda/login");

  const itemsCarrito = await leerCarritoCookie();

  // Hidratar líneas con producto + precio del cliente (solo productos activos).
  let lineas: LineaHidratada[] = [];
  if (itemsCarrito.length > 0) {
    const productoIds = itemsCarrito.map((i) => i.producto_id);
    const [productos, precios] = await Promise.all([
      prisma.productos.findMany({ where: { id: { in: productoIds }, activo: true } }),
      prisma.precios_cliente.findMany({
        where: { cliente_id: cliente.id, producto_id: { in: productoIds } },
      }),
    ]);
    const productosMap = new Map(productos.map((p) => [p.id, p]));
    const preciosMap = new Map(precios.map((p) => [p.producto_id, Number(p.precio)]));

    lineas = itemsCarrito
      .map((i) => {
        const p = productosMap.get(i.producto_id);
        if (!p) return null;
        const precio = precioEfectivo(Number(p.precio_base), preciosMap.get(p.id));
        return {
          producto_id: p.id,
          nombre: p.nombre,
          unidad: p.unidad,
          imagen_url: p.imagen_url,
          cantidad: i.cantidad,
          precio_unitario: precio,
        };
      })
      .filter((l): l is LineaHidratada => l !== null);
  }

  // Cliente sin ruta: no se puede calcular entrega.
  const sinRuta = !cliente.ruta_id || !cliente.ruta;

  let fechas: FechaOpcion[] = [];
  let sedes: SedeOpcion[] = [];
  let rutaNombre = "";
  let diasRutaLabel = "";
  if (!sinRuta && cliente.ruta) {
    rutaNombre = cliente.ruta.nombre;
    diasRutaLabel = etiquetaDiasRuta(cliente.ruta.dias_semana);
    const disponibles = proximasFechasEntrega({
      dias_semana: cliente.ruta.dias_semana,
      frecuencia: cliente.ruta.frecuencia,
      fecha_base: cliente.ruta.fecha_base,
    });
    fechas = disponibles.map((f) => ({ valor: f, etiqueta: etiquetaFecha(f) }));

    const sedesDb = await prisma.sedes.findMany({
      where: { cliente_id: cliente.id, activa: true },
      orderBy: [{ es_principal: "desc" }, { nombre_sede: "asc" }],
    });
    sedes = sedesDb.map((s) => ({
      id: s.id,
      nombre_sede: s.nombre_sede,
      direccion: s.direccion,
    }));
  }

  if (sinRuta) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Button
            href="/tienda"
            variant="secondary"
            leftIcon={<ChevronLeft aria-hidden="true" className="h-4 w-4" />}
          >
            Volver a la tienda
          </Button>
          <Card padding="none" className="mt-6">
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="Tu cuenta no tiene una ruta de entrega asignada"
              description="Comunícate con nosotros para poder programar tu entrega."
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <CarritoCliente
      lineasIniciales={lineas}
      fechas={fechas}
      sedes={sedes}
      direccionCliente={cliente.direccion}
      rutaNombre={rutaNombre}
      diasRutaLabel={diasRutaLabel}
    />
  );
}
