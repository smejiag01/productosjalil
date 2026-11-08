import Link from "next/link";
import { obtenerDatosNegocio } from "@/lib/datos-negocio";
import { CanalContacto, Encabezado, Lista, Seccion } from "../_componentes";

export const revalidate = 3600;

export const metadata = { title: "Eliminación de datos" };

export default async function EliminacionDatosPage() {
  const negocio = await obtenerDatosNegocio();

  return (
    <>
      <Encabezado titulo="Cómo solicitar la eliminación de tus datos">
        Puedes pedir en cualquier momento que {negocio.nombre} elimine los datos personales que tiene
        sobre ti, incluidos los que recibimos a través de WhatsApp.
      </Encabezado>

      <Seccion titulo="1. Haz la solicitud">
        <p>
          Envía tu solicitud <CanalContacto negocio={negocio} /> indicando:
        </p>
        <Lista
          items={[
            "Tu nombre y el de tu negocio.",
            "El NIT o número de documento con el que estás registrado.",
            "El número de teléfono o WhatsApp cuyos datos quieres eliminar.",
            "Qué datos quieres eliminar (todos, o solo algunos, por ejemplo un número de contacto).",
          ]}
        />
      </Seccion>

      <Seccion titulo="2. Verificación y respuesta">
        <p>
          Para proteger tu información verificaremos que la solicitud venga del titular o de alguien
          autorizado por el negocio. Te responderemos en un plazo máximo de quince (15) días hábiles
          confirmando lo que se eliminó.
        </p>
      </Seccion>

      <Seccion titulo="3. Qué se elimina y qué se conserva">
        <Lista
          items={[
            "Eliminamos tus datos de contacto, conversaciones y archivos de WhatsApp, direcciones y ubicaciones de entrega.",
            "Si eliminas todos tus datos, tu acceso a la tienda en línea quedará desactivado.",
            "Conservamos solo la información que la ley nos obliga a guardar, como los registros contables y de facturación de los pedidos ya realizados, durante el tiempo que la ley exige.",
          ]}
        />
      </Seccion>

      <Seccion titulo="4. Más información">
        <p>
          Consulta nuestra{" "}
          <Link href="/privacidad" className="font-medium text-brand-700 hover:underline">
            Política de privacidad
          </Link>{" "}
          para conocer todos tus derechos sobre tus datos personales.
        </p>
      </Seccion>
    </>
  );
}
