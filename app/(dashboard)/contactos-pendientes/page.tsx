import { prisma } from "@/lib/prisma";
import { formatearFechaHora } from "@/lib/fechas";
import TablaContactos from "./TablaContactos";

export const dynamic = "force-dynamic";

export default async function ContactosPendientesPage() {
  const contactos = await prisma.contactos_pendientes.findMany({
    orderBy: { created_at: "desc" },
  });

  const contactosSerializados = contactos.map((c) => ({
    id: c.id,
    telefono: c.telefono,
    nombrePerfil: c.nombre_perfil,
    motivo: c.motivo,
    telefonoContacto: c.telefono_contacto,
    nitIntentado: c.nit_intentado,
    notas: c.notas,
    atendido: c.atendido,
    fecha: formatearFechaHora(c.created_at),
  }));

  const pendientes = contactosSerializados.filter((c) => !c.atendido).length;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">Por contactar</h1>
          <span className="text-sm text-ink-500 font-medium">{contactosSerializados.length} registros</span>
        </div>
        <p className="text-ink-600 text-sm mt-1">
          Personas que hay que contactar
          {pendientes > 0 && ` — ${pendientes} pendiente${pendientes === 1 ? "" : "s"}`}
        </p>
      </div>

      <TablaContactos contactos={contactosSerializados} />
    </div>
  );
}
