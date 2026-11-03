import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerClienteSesion } from "@/lib/tienda-auth";
import LoginFormTienda from "./LoginFormTienda";

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen bg-[#1E1E2D] flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4">
          PJ
        </div>
        <h1 className="text-white text-xl font-semibold">Productos Jalil</h1>
        <p className="text-gray-400 text-sm">CARNICERÍA · TIENDA EN LÍNEA</p>
      </div>

      <LoginFormTienda whatsappAtencion={whatsapp} />

      <p className="mt-8 text-gray-500 text-xs text-center max-w-md">
        Ingresa con el NIT o documento registrado en Productos Jalil.
      </p>
    </div>
  );
}
