import { obtenerDatosNegocio } from "@/lib/datos-negocio";
import { CanalContacto, DatosContacto, Encabezado, Lista, Seccion } from "../_componentes";

export const revalidate = 3600;

export const metadata = { title: "Política de privacidad" };

export default async function PrivacidadPage() {
  const negocio = await obtenerDatosNegocio();

  return (
    <>
      <Encabezado titulo="Política de privacidad y tratamiento de datos personales">
        En {negocio.nombre} cuidamos la información de nuestros clientes. Esta política explica qué
        datos recogemos cuando haces pedidos en nuestra tienda en línea o nos escribes por WhatsApp,
        para qué los usamos y cómo puedes ejercer tus derechos, de acuerdo con la Ley 1581 de 2012 y
        el Decreto 1377 de 2013 de Colombia.
      </Encabezado>

      <Seccion titulo="1. Responsable del tratamiento">
        <DatosContacto negocio={negocio} />
      </Seccion>

      <Seccion titulo="2. Datos que recogemos">
        <Lista
          items={[
            "Datos de identificación del cliente o de su negocio: nombre, razón social y NIT o número de documento.",
            "Datos de contacto: números de teléfono y de WhatsApp de la empresa y de sus contactos autorizados.",
            "Datos de entrega: direcciones de las sedes y su ubicación en el mapa.",
            "Datos de los pedidos: productos, cantidades, precios, fechas de entrega y su estado.",
            "Mensajes que nos envías por WhatsApp y los archivos que adjuntes (por ejemplo, fotos de una petición, queja o reclamo).",
            "Datos técnicos mínimos para mantener tu sesión en la tienda en línea (cookies propias necesarias).",
          ]}
        />
        <p>No recogemos datos sensibles ni datos de menores de edad.</p>
      </Seccion>

      <Seccion titulo="3. Para qué usamos tus datos">
        <Lista
          items={[
            "Recibir, preparar, despachar y entregar tus pedidos.",
            "Identificarte al ingresar a la tienda y mostrarte tus precios y fechas de entrega.",
            "Enviarte por WhatsApp la confirmación de tus pedidos, avisos de despacho y recordatorios para hacer tu pedido en los días de tu ruta.",
            "Atender tus peticiones, quejas, reclamos y solicitudes de contacto con un asesor.",
            "Llevar los registros contables, de facturación y de entregas que exige la ley.",
          ]}
        />
        <p>No vendemos ni alquilamos tus datos, y no los usamos para fines distintos a los descritos.</p>
      </Seccion>

      <Seccion titulo="4. Con quién compartimos los datos">
        <p>
          Solo los compartimos con proveedores que nos prestan servicios tecnológicos y que los
          tratan por cuenta nuestra:
        </p>
        <Lista
          items={[
            "Meta Platforms (WhatsApp Business), para enviar y recibir mensajes de WhatsApp.",
            "Vercel, que aloja la tienda en línea y el sistema de gestión.",
            "Neon, que aloja la base de datos donde se guardan los pedidos y clientes.",
            "Google (Google Maps), para ubicar en el mapa las direcciones de entrega.",
          ]}
        />
        <p>
          Algunos de estos proveedores pueden almacenar la información fuera de Colombia. Al usar
          nuestros servicios autorizas esa transferencia, que se hace con medidas de seguridad
          adecuadas. También entregaremos datos a autoridades cuando una ley o una orden lo exija.
        </p>
      </Seccion>

      <Seccion titulo="5. Tus derechos">
        <p>Como titular de los datos tienes derecho a:</p>
        <Lista
          items={[
            "Conocer, actualizar y rectificar tus datos.",
            "Pedir prueba de la autorización que nos diste.",
            "Saber cómo hemos usado tus datos.",
            "Revocar la autorización o pedir que eliminemos tus datos, cuando no exista un deber legal o contractual de conservarlos.",
            "Dejar de recibir recordatorios por WhatsApp cuando quieras.",
            "Presentar quejas ante la Superintendencia de Industria y Comercio.",
          ]}
        />
        <p>
          Puedes ejercerlos <CanalContacto negocio={negocio} />. Responderemos las consultas en un
          máximo de diez (10) días hábiles y los reclamos en un máximo de quince (15) días hábiles,
          según la ley.
        </p>
      </Seccion>

      <Seccion titulo="6. Conservación y seguridad">
        <p>
          Guardamos tus datos mientras seas nuestro cliente y durante el tiempo que exijan las normas
          contables, tributarias y comerciales. Usamos conexiones cifradas, acceso restringido al
          sistema y contraseñas protegidas para evitar accesos no autorizados.
        </p>
      </Seccion>

      <Seccion titulo="7. Cambios a esta política">
        <p>
          Si cambiamos esta política publicaremos la nueva versión en esta misma página, con su
          fecha de vigencia.
        </p>
      </Seccion>
    </>
  );
}
