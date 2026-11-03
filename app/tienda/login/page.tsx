import { redirect } from "next/navigation";
import AuthCard from "@/components/ui/AuthCard";
import { prisma } from "@/lib/prisma";
import { obtenerClienteSesion } from "@/lib/tienda-auth";
import LoginFormTienda from "./LoginFormTienda";

export const dynamic = "force-dynamic";

export const metadata = { title: "Entrar" };

export default async function LoginTiendaPage() {
  // Si ya hay sesión válida, directo a la tienda.
  const cliente = await obtenerClienteSesion();
  if (cliente) redirect("/tienda");

  // WhatsApp de atención (editable en Configuración). Se vuelve a validar aquí
  // porque termina dentro de un enlace: solo dígitos, o no se muestra el botón.
  const config = await prisma.configuracion.findFirst({
    select: { whatsapp_atencion: true },
  });
  const whatsapp =
    config?.whatsapp_atencion && /^\d{10,15}$/.test(config.whatsapp_atencion)
      ? config.whatsapp_atencion
      : null;

  return (
    <AuthCard
      etiqueta="Tienda en línea"
      title="Entrar a la tienda"
      subtitle="Escribe tu NIT o número de documento para ver tus precios y hacer tu pedido."
      footer="Ingresa con el NIT o documento registrado en Productos Jalil."
    >
      <LoginFormTienda whatsappAtencion={whatsapp} />
    </AuthCard>
  );
}
