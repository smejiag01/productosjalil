/**
 * Estado local de la app del vendedor (navegador): la jornada en curso, sus
 * visitas y la cola de operaciones pendientes de enviar. Permite trabajar sin
 * señal; se sincroniza con /api/vendedor/sincronizar cuando hay conexión.
 * Todo acceso a localStorage va en try/catch (modo privado, almacenamiento lleno).
 */

export interface VisitaLocal {
  id: string;
  registrada_at: string;
  nicho: string;
  nombre_empresa: string;
  direccion: string | null;
  telefono: string | null;
  contacto: string | null;
  observaciones: string | null;
  tieneUbicacion: boolean;
  sincronizada: boolean;
}

export interface JornadaLocal {
  id: string;
  ciudad: string;
  inicio_at: string;
  visitas: VisitaLocal[];
}

export interface EstadoLocal {
  jornada: JornadaLocal | null;
  ultimaCiudad: string | null;
  /** Operaciones aún no aceptadas por el servidor, en orden. */
  cola: Record<string, unknown>[];
}

const VACIO: EstadoLocal = { jornada: null, ultimaCiudad: null, cola: [] };

function clave(usuarioId: string): string {
  return `pj_vendedor_v1:${usuarioId}`;
}

export function leerEstado(usuarioId: string): EstadoLocal {
  try {
    const crudo = localStorage.getItem(clave(usuarioId));
    if (!crudo) return VACIO;
    const datos = JSON.parse(crudo) as Partial<EstadoLocal>;
    return {
      jornada: datos.jornada ?? null,
      ultimaCiudad: datos.ultimaCiudad ?? null,
      cola: Array.isArray(datos.cola) ? datos.cola : [],
    };
  } catch {
    return VACIO;
  }
}

export function guardarEstado(usuarioId: string, estado: EstadoLocal): void {
  try {
    localStorage.setItem(clave(usuarioId), JSON.stringify(estado));
  } catch {
    // Sin almacenamiento local la app sigue funcionando mientras haya señal.
  }
}

export interface Ubicacion {
  lat: number;
  lng: number;
  precision: number;
}

/** Pide la ubicación del celular; null si no hay permiso, GPS o tarda demasiado. */
export function obtenerUbicacion(timeoutMs = 15000): Promise<Ubicacion | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: Math.round(pos.coords.latitude * 1e6) / 1e6,
          lng: Math.round(pos.coords.longitude * 1e6) / 1e6,
          precision: Math.round(pos.coords.accuracy),
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}

export function nuevoId(): string {
  return crypto.randomUUID();
}
