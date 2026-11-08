import Link from "next/link";
import { obtenerDatosNegocio } from "@/lib/datos-negocio";
import { CanalContacto, DatosContacto, Encabezado, Lista, Seccion } from "../_componentes";

export const revalidate = 3600;

export const metadata = { title: "Términos y condiciones" };

export default async function TerminosPage() {
  const negocio = await obtenerDatosNegocio();

  return (
    <>
      <Encabezado titulo="Términos y condiciones del servicio">
        Estos términos regulan el uso de la tienda en línea y del canal de WhatsApp de{" "}
        {negocio.nombre} para hacer pedidos. Al usarlos aceptas estas condiciones.
      </Encabezado>

      <Seccion titulo="1. Quiénes somos">
        <DatosContacto negocio={negocio} />
      </Seccion>

      <Seccion titulo="2. A quién va dirigido el servicio">
        <p>
          La tienda en línea es para clientes registrados de {negocio.nombre}. Para ingresar se usa
          el NIT o número de documento con el que el cliente está registrado. Eres responsable de no
          compartir ese dato con personas no autorizadas a pedir en nombre de tu negocio. Si eres un
          cliente nuevo, comunícate con nosotros para registrarte.
        </p>
      </Seccion>

      <Seccion titulo="3. Pedidos">
        <Lista
          items={[
            "Los pedidos se entregan en las fechas y rutas asignadas a cada cliente; la tienda solo muestra fechas disponibles.",
            "Los precios se muestran en pesos colombianos (COP) e incluyen los precios acordados con cada cliente. El valor final del pedido es el que confirma el sistema al enviarlo.",
            "Todo pedido está sujeto a la disponibilidad de los productos.",
            "Una vez enviado, recibirás una confirmación por WhatsApp. Si necesitas modificar o cancelar un pedido, comunícate con nosotros antes de que salga a ruta.",
          ]}
        />
      </Seccion>

      <Seccion titulo="4. Entregas y devoluciones">
        <p>
          Entregamos en la dirección de la sede elegida en el pedido. Al recibir, revisa los
          productos. Si un pedido no se puede entregar o presenta un problema, el repartidor dejará
          el registro y te contactaremos para resolverlo.
        </p>
      </Seccion>

      <Seccion titulo="5. Mensajes por WhatsApp">
        <p>
          Al ser nuestro cliente aceptas recibir por WhatsApp mensajes relacionados con tus pedidos:
          confirmaciones, avisos de despacho y recordatorios en los días de tu ruta. Puedes pedir que
          dejemos de enviarte recordatorios en cualquier momento <CanalContacto negocio={negocio} />.
        </p>
      </Seccion>

      <Seccion titulo="6. Peticiones, quejas y reclamos">
        <p>
          Puedes presentar peticiones, quejas o reclamos <CanalContacto negocio={negocio} />. Los
          atenderemos en los plazos que establece la ley.
        </p>
      </Seccion>

      <Seccion titulo="7. Datos personales">
        <p>
          El uso de tus datos se rige por nuestra{" "}
          <Link href="/privacidad" className="font-medium text-brand-700 hover:underline">
            Política de privacidad
          </Link>
          .
        </p>
      </Seccion>

      <Seccion titulo="8. Cambios y ley aplicable">
        <p>
          Podemos actualizar estos términos y publicaremos la nueva versión en esta página. Estos
          términos se rigen por las leyes de la República de Colombia.
        </p>
      </Seccion>
    </>
  );
}
