import { prisma } from "@/lib/prisma";

/** Razón social registrada del negocio (ver CLAUDE.md). */
export const RAZON_SOCIAL = "PRODUCTOS JALIL TRADICION ARTESANAL";

export interface DatosNegocio {
  nombre: string;
  razonSocial: string;
  nit: string | null;
  direccion: string | null;
  telefono: string | null;
  /** Solo dígitos con indicativo (ej. 573001234567), o null si no está configurado. */
  whatsapp: string | null;
}

/**
 * Datos públicos del negocio para las páginas legales. Salen de Configuración
 * → Negocio, así que se actualizan solos cuando el negocio los completa.
 */
export async function obtenerDatosNegocio(): Promise<DatosNegocio> {
  const config = await prisma.configuracion.findFirst({
    select: { nombre_negocio: true, nit: true, direccion: true, telefono: true, whatsapp_atencion: true },
  });
  const whatsapp = config?.whatsapp_atencion && /^\d{10,15}$/.test(config.whatsapp_atencion)
    ? config.whatsapp_atencion
    : null;

  return {
    nombre: config?.nombre_negocio || "Productos Jalil",
    razonSocial: RAZON_SOCIAL,
    nit: config?.nit?.trim() || null,
    direccion: config?.direccion?.trim() || null,
    telefono: config?.telefono?.trim() || null,
    whatsapp,
  };
}

/** "+57 316 333 2739" a partir de "573163332739" (solo para mostrar). */
export function formatearWhatsapp(numero: string): string {
  if (numero.startsWith("57") && numero.length === 12) {
    return `+57 ${numero.slice(2, 5)} ${numero.slice(5, 8)} ${numero.slice(8)}`;
  }
  return `+${numero}`;
}
