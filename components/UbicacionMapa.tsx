"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Input } from "@/components/ui/campos";
import { MapPin, Search, X } from "@/components/ui/icons";
import { CLAVE_GOOGLE_MAPS, cargarGoogleMaps } from "@/lib/google-maps-cliente";
import {
  enlaceGoogleMaps,
  esUrlDeGoogleMaps,
  parsearUbicacion,
  type Coordenadas,
} from "@/lib/ubicacion";

// Centro inicial cuando aún no hay punto: el Eje Cafetero (zona de las rutas)
const CENTRO_INICIAL = { lat: 4.81, lng: -75.69 };

interface Props {
  direccion: string;
  onDireccion: (valor: string) => void;
  latitud: number | null;
  longitud: number | null;
  onUbicacion: (coordenadas: Coordenadas | null) => void;
  etiqueta?: string;
  placeholder?: string;
}

type EstadoMapa = "cargando" | "listo" | "no-disponible";

function aCoordenadas(
  p: google.maps.LatLng | google.maps.LatLngLiteral | google.maps.LatLngAltitude | null | undefined
): Coordenadas | null {
  if (!p) return null;
  const lat = typeof p.lat === "function" ? p.lat() : p.lat;
  const lng = typeof p.lng === "function" ? p.lng() : p.lng;
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}

/**
 * Dirección + ubicación en Google Maps. Con clave de Google: buscador de
 * lugares, mapa y pin que se arrastra. Sin clave (o si Google la rechaza): se
 * pega un enlace de Google Maps (o "lat, lng") y se ve una vista previa.
 * El formulario nunca muestra latitud/longitud como campos.
 */
export default function UbicacionMapa({
  direccion,
  onDireccion,
  latitud,
  longitud,
  onUbicacion,
  etiqueta = "Dirección",
  placeholder = "Dirección de entrega",
}: Props) {
  const hayPunto = latitud !== null && longitud !== null;
  const [estado, setEstado] = useState<EstadoMapa>(CLAVE_GOOGLE_MAPS ? "cargando" : "no-disponible");
  const [enlace, setEnlace] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [resolviendo, setResolviendo] = useState(false);
  const [vistaDireccion, setVistaDireccion] = useState("");

  const contenedorMapa = useRef<HTMLDivElement>(null);
  const contenedorBuscador = useRef<HTMLDivElement>(null);
  const mapa = useRef<google.maps.Map | null>(null);
  const pin = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Los manejadores de Google viven más que un render: siempre usan lo último.
  const alUbicar = useRef(onUbicacion);
  const alDireccion = useRef(onDireccion);
  const direccionActual = useRef(direccion);
  alUbicar.current = onUbicacion;
  alDireccion.current = onDireccion;
  direccionActual.current = direccion;

  const colocarPin = useCallback((c: Coordenadas, centrar: boolean) => {
    if (!mapa.current || !pin.current) return;
    pin.current.position = c;
    pin.current.map = mapa.current;
    if (centrar) {
      mapa.current.panTo(c);
      if ((mapa.current.getZoom() ?? 0) < 16) mapa.current.setZoom(17);
    }
  }, []);

  // Carga de Google Maps y creación del mapa, el pin y el buscador (una vez)
  useEffect(() => {
    if (!CLAVE_GOOGLE_MAPS) return;
    let cancelado = false;
    let buscador: HTMLElement | null = null;

    (async () => {
      try {
        await cargarGoogleMaps();
        const [{ Map }, { AdvancedMarkerElement }, { PlaceAutocompleteElement }] = await Promise.all([
          google.maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
          google.maps.importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
          google.maps.importLibrary("places") as Promise<google.maps.PlacesLibrary>,
        ]);
        if (cancelado || !contenedorMapa.current) return;

        const inicial = latitud !== null && longitud !== null ? { lat: latitud, lng: longitud } : null;
        const m = new Map(contenedorMapa.current, {
          center: inicial ?? CENTRO_INICIAL,
          zoom: inicial ? 17 : 12,
          // "DEMO_MAP_ID" habilita los marcadores avanzados sin crear un estilo en Google Cloud
          mapId: "DEMO_MAP_ID",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
        });
        mapa.current = m;

        const p = new AdvancedMarkerElement({
          map: inicial ? m : null,
          position: inicial,
          gmpDraggable: true,
          title: "Ubicación. Arrástrala para ajustarla",
        });
        pin.current = p;
        p.addListener("dragend", () => {
          const c = aCoordenadas(p.position);
          if (c) alUbicar.current(c);
        });
        m.addListener("click", (e: google.maps.MapMouseEvent) => {
          const c = aCoordenadas(e.latLng);
          if (!c) return;
          colocarPin(c, false);
          alUbicar.current(c);
        });

        if (contenedorBuscador.current) {
          buscador = new PlaceAutocompleteElement({ includedRegionCodes: ["co"] }) as HTMLElement;
          buscador.style.width = "100%";
          buscador.style.colorScheme = "light";
          contenedorBuscador.current.replaceChildren(buscador);
          const alElegir = async (ev: Event) => {
            const prediccion = (ev as unknown as { placePrediction?: google.maps.places.PlacePrediction })
              .placePrediction;
            if (!prediccion) return;
            const lugar = prediccion.toPlace();
            await lugar.fetchFields({ fields: ["formattedAddress", "location"] });
            const c = aCoordenadas(lugar.location);
            if (!c) return;
            colocarPin(c, true);
            alUbicar.current(c);
            // No pisa una dirección que el administrador ya escribió
            if (!direccionActual.current.trim() && lugar.formattedAddress) {
              alDireccion.current(lugar.formattedAddress);
            }
          };
          // El evento se llamó "gmp-placeselect" en versiones anteriores
          buscador.addEventListener("gmp-select", alElegir);
          buscador.addEventListener("gmp-placeselect", alElegir);
        }

        setEstado("listo");
      } catch {
        if (!cancelado) setEstado("no-disponible");
      }
    })();

    return () => {
      cancelado = true;
      buscador?.remove();
      if (pin.current) pin.current.map = null;
      pin.current = null;
      mapa.current = null;
    };
    // Solo al montar: los cambios posteriores de latitud/longitud se sincronizan abajo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el punto cambia desde fuera (enlace pegado, "Quitar"), el pin lo sigue
  useEffect(() => {
    if (estado !== "listo" || !pin.current) return;
    if (latitud === null || longitud === null) {
      pin.current.map = null;
      return;
    }
    const actual = aCoordenadas(pin.current.position);
    if (!actual || actual.lat !== latitud || actual.lng !== longitud) {
      colocarPin({ lat: latitud, lng: longitud }, true);
    }
  }, [latitud, longitud, estado, colocarPin]);

  async function aplicarEnlace() {
    const texto = enlace.trim();
    if (!texto) return;
    setMensaje("");

    const local = parsearUbicacion(texto);
    if (local) {
      onUbicacion(local);
      setEnlace("");
      return;
    }
    if (!esUrlDeGoogleMaps(texto)) {
      setMensaje("No reconocimos eso. Pega un enlace de Google Maps o coordenadas como 4.8087, -75.6906.");
      return;
    }

    setResolviendo(true);
    try {
      const res = await fetch("/api/ubicacion/resolver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: texto }),
      });
      const data = await res.json();
      if (data.success) {
        onUbicacion(data.data as Coordenadas);
        setEnlace("");
      } else {
        setMensaje(data.error || "No se pudo leer el enlace");
      }
    } catch {
      setMensaje("Error de conexión. Intenta de nuevo.");
    } finally {
      setResolviendo(false);
    }
  }

  const interactivo = estado !== "no-disponible";
  const urlVista = hayPunto
    ? `https://www.google.com/maps?q=${latitud},${longitud}&z=17&output=embed`
    : vistaDireccion
      ? `https://www.google.com/maps?q=${encodeURIComponent(`${vistaDireccion}, Colombia`)}&z=16&output=embed`
      : null;

  return (
    <div className="space-y-3">
      <Field label={etiqueta}>
        {(p) => (
          <Input
            {...p}
            type="text"
            value={direccion}
            onChange={(e) => onDireccion(e.target.value)}
            placeholder={placeholder}
          />
        )}
      </Field>

      <div className="space-y-2 rounded-card border border-ink-200 bg-ink-50 p-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink-800">
          <MapPin aria-hidden="true" className="h-4 w-4 text-brand-600" />
          Ubicación en Google Maps
        </p>

        {interactivo && (
          <>
            <div ref={contenedorBuscador} role="search" aria-label="Buscar un lugar en Google Maps" />
            <div
              ref={contenedorMapa}
              className="h-56 w-full overflow-hidden rounded-control border border-ink-200 bg-ink-100"
            />
            {estado === "cargando" && <p className="text-xs text-ink-600">Cargando el mapa…</p>}
            {estado === "listo" && (
              <p className="text-xs text-ink-600">
                Busca el lugar, toca el mapa o arrastra el pin para ubicarlo con exactitud.
              </p>
            )}
          </>
        )}

        {!interactivo && urlVista && (
          <iframe
            title="Vista previa de la ubicación en Google Maps"
            src={urlVista}
            loading="lazy"
            className="h-56 w-full rounded-control border border-ink-200 bg-ink-100"
          />
        )}

        <details open={!interactivo}>
          <summary className="cursor-pointer text-sm font-medium text-brand-700 hover:underline">
            {interactivo ? "¿Tienes un enlace de Google Maps?" : "Pegar enlace de Google Maps o coordenadas"}
          </summary>
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void aplicarEnlace();
                  }
                }}
                aria-label="Enlace de Google Maps o coordenadas"
                placeholder="https://maps.app.goo.gl/… o 4.8087, -75.6906"
                className="block h-11 w-full min-w-0 rounded-control border border-ink-300 bg-white px-3 text-base text-ink-900 outline-none placeholder:text-ink-500 focus:border-brand focus:ring-2 focus:ring-brand/20 sm:text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => void aplicarEnlace()}
                loading={resolviendo}
                disabled={!enlace.trim()}
              >
                Ubicar
              </Button>
            </div>
            {mensaje && (
              <p role="alert" className="text-xs font-medium text-danger">
                {mensaje}
              </p>
            )}
            {!interactivo && (
              <p className="text-xs text-ink-600">
                En Google Maps abre el lugar, pulsa “Compartir”, copia el enlace y pégalo aquí.
              </p>
            )}
          </div>
        </details>

        {!interactivo && !hayPunto && direccion.trim() && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Search aria-hidden="true" className="h-4 w-4" />}
            onClick={() => setVistaDireccion(direccion.trim())}
          >
            Ver la dirección en el mapa
          </Button>
        )}

        {hayPunto && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 pt-2">
            <p className="text-sm font-medium text-ok">✓ Ubicación guardada</p>
            <div className="flex items-center gap-2">
              <Button
                href={enlaceGoogleMaps(latitud, longitud)}
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                size="sm"
              >
                Abrir en Google Maps
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<X aria-hidden="true" className="h-4 w-4" />}
                onClick={() => onUbicacion(null)}
              >
                Quitar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
