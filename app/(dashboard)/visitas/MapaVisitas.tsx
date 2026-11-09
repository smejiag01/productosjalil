"use client";

import { useEffect, useRef } from "react";
import type { CircleMarker, Map as MapaLeaflet } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { VisitaPanel } from "./tipos";

// Centro por defecto: Pereira (si todavía no hay visitas con ubicación).
const CENTRO_DEFECTO: [number, number] = [4.8133, -75.6961];

function contenidoPopup(v: VisitaPanel): HTMLElement {
  // Se arma con textContent (nunca innerHTML): los datos los escribe el vendedor.
  const caja = document.createElement("div");
  const titulo = document.createElement("strong");
  titulo.textContent = v.nombreEmpresa;
  const linea = document.createElement("div");
  linea.textContent = `${v.nicho} · ${v.hora} · ${v.vendedor}`;
  caja.append(titulo, linea);
  if (v.direccion) {
    const dir = document.createElement("div");
    dir.textContent = v.direccion;
    caja.append(dir);
  }
  return caja;
}

export default function MapaVisitas({
  visitas,
  seleccionId,
}: {
  visitas: VisitaPanel[];
  seleccionId: string | null;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const marcadores = useRef(new Map<string, CircleMarker>());

  // Crea el mapa y dibuja los puntos cada vez que cambian las visitas.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !contenedor.current) return;

      if (!mapa.current) {
        mapa.current = L.map(contenedor.current, { scrollWheelZoom: false }).setView(CENTRO_DEFECTO, 12);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapa.current);
      }
      const m = mapa.current;

      marcadores.current.forEach((mk) => mk.remove());
      marcadores.current.clear();

      const puntos: [number, number][] = [];
      for (const v of visitas) {
        if (v.latitud === null || v.longitud === null) continue;
        const punto: [number, number] = [v.latitud, v.longitud];
        puntos.push(punto);
        const mk = L.circleMarker(punto, {
          radius: 9,
          color: "#FFFFFF",
          weight: 2,
          fillColor: v.colorVendedor,
          fillOpacity: 0.95,
        })
          .bindPopup(contenidoPopup(v))
          .addTo(m);
        marcadores.current.set(v.id, mk);
      }

      if (puntos.length === 1) m.setView(puntos[0], 16);
      else if (puntos.length > 1) m.fitBounds(L.latLngBounds(puntos), { padding: [32, 32], maxZoom: 16 });
    })();
    return () => {
      cancelado = true;
    };
  }, [visitas]);

  // Al elegir "Ver en mapa" en la lista, centra y abre esa visita.
  useEffect(() => {
    if (!seleccionId || !mapa.current) return;
    const mk = marcadores.current.get(seleccionId);
    if (!mk) return;
    mapa.current.setView(mk.getLatLng(), 17);
    mk.openPopup();
  }, [seleccionId]);

  // Libera el mapa al salir de la página.
  useEffect(() => {
    const marcas = marcadores.current;
    return () => {
      mapa.current?.remove();
      mapa.current = null;
      marcas.clear();
    };
  }, []);

  return (
    <div
      ref={contenedor}
      className="isolate h-80 w-full overflow-hidden rounded-card border border-ink-200 sm:h-96"
      role="region"
      aria-label="Mapa de visitas"
    />
  );
}
