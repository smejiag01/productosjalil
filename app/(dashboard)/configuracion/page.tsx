import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ConfiguracionTabs from "./ConfiguracionTabs";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [config, session] = await Promise.all([
    prisma.configuracion.findFirst(),
    getServerSession(authOptions),
  ]);

  const configSerializada = config
    ? {
        id: config.id,
        nombre_negocio: config.nombre_negocio,
        nit: config.nit,
        direccion: config.direccion,
        telefono: config.telefono,
        hora_recordatorio: config.hora_recordatorio
          ? new Date(config.hora_recordatorio).toISOString().slice(11, 16)
          : "07:00",
        horas_espera_followup: config.horas_espera_followup,
        mensaje_recordatorio: config.mensaje_recordatorio,
        mensaje_followup: config.mensaje_followup,
      }
    : null;

  return (
    <ConfiguracionTabs
      config={configSerializada}
      correoUsuario={session?.user?.email ?? ""}
    />
  );
}
