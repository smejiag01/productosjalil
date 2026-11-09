import { prisma } from "@/lib/prisma";
import { hoyStr } from "@/lib/analiticas/periodos";
import { horaBogota, notasContactoDesdeVisita, resolverRangoVisitas } from "@/lib/visitas";
import { obtenerJornadas } from "@/lib/visitas-admin";
import { acento, estadosPedido, marca, semantica } from "@/lib/design/tokens";
import PanelVisitas from "./PanelVisitas";
import type { JornadaPanel } from "./tipos";

export const dynamic = "force-dynamic";

/** Un color fijo por vendedor para distinguirlos en el mapa y en la lista. */
const COLORES_VENDEDOR = [
  marca[600],
  semantica.info,
  semantica.ok,
  estadosPedido.en_reparto.fondo,
  acento,
  marca[800],
];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function etiquetaFecha(fecha: Date): string {
  const texto = new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default async function VisitasPage(props: {
  searchParams: Promise<{ desde?: string; hasta?: string; vendedor?: string }>;
}) {
  const sp = await props.searchParams;
  const { desde, hasta } = resolverRangoVisitas(sp.desde, sp.hasta, hoyStr());
  const vendedorId = sp.vendedor && UUID.test(sp.vendedor) ? sp.vendedor : null;

  const [jornadas, vendedores, rutas] = await Promise.all([
    obtenerJornadas({ desde, hasta, vendedorId }),
    prisma.usuarios.findMany({
      where: { rol: "vendedor" },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.rutas.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const colorDe = (id: string) => {
    const i = vendedores.findIndex((v) => v.id === id);
    return COLORES_VENDEDOR[(i < 0 ? 0 : i) % COLORES_VENDEDOR.length];
  };

  const datos: JornadaPanel[] = jornadas.map((j) => ({
    id: j.id,
    fechaLabel: etiquetaFecha(j.fecha),
    ciudad: j.ciudad,
    vendedor: j.vendedor.nombre,
    colorVendedor: colorDe(j.vendedor.id),
    horaInicio: horaBogota(j.inicio_at),
    horaFin: j.fin_at ? horaBogota(j.fin_at) : null,
    visitas: j.visitas.map((v) => ({
      id: v.id,
      hora: horaBogota(v.registrada_at),
      nicho: v.nicho,
      nombreEmpresa: v.nombre_empresa,
      direccion: v.direccion,
      telefono: v.telefono,
      contacto: v.contacto,
      observaciones: v.observaciones,
      latitud: v.latitud,
      longitud: v.longitud,
      clienteId: v.cliente?.id ?? null,
      clienteNombre: v.cliente?.nombre ?? null,
      enPorContactar: !!v.contacto_pendiente_id,
      notas: notasContactoDesdeVisita({ ...v, vendedor: j.vendedor.nombre }),
      vendedor: j.vendedor.nombre,
      colorVendedor: colorDe(j.vendedor.id),
    })),
  }));

  return (
    <PanelVisitas
      jornadas={datos}
      vendedores={vendedores}
      rutas={rutas}
      filtro={{ desde, hasta, vendedorId }}
    />
  );
}
