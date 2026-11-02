import { prisma } from "@/lib/prisma";

/**
 * Límite de intentos fallidos del login de la tienda (anti fuerza bruta).
 * Se guarda en la BD porque en Vercel cada petición puede caer en otra
 * instancia y un contador en memoria no sería confiable.
 */

const VENTANA_MS = 15 * 60 * 1000;
const RETENCION_MS = 24 * 60 * 60 * 1000;

export const LIMITE_FALLOS_POR_NIT = 5;
export const LIMITE_FALLOS_POR_IP = 20;

/** Decisión pura (sin BD) para poder testearla. */
export function superaLimite(fallosNit: number, fallosIp: number): boolean {
  return fallosNit >= LIMITE_FALLOS_POR_NIT || fallosIp >= LIMITE_FALLOS_POR_IP;
}

/**
 * IP del cliente. En Vercel x-real-ip y x-forwarded-for los fija la plataforma
 * (no el navegador). Si algún día se despliega detrás de otro proxy, ese proxy
 * debe sobrescribirlos.
 */
export function obtenerIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim().slice(0, 64);
  const reenviada = request.headers.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0].trim().slice(0, 64);
  return "desconocida";
}

const claveNit = (nit: string) => `nit:${nit.slice(0, 60)}`;
const claveIp = (ip: string) => `ip:${ip}`;

export async function loginBloqueado(ip: string, nit: string): Promise<boolean> {
  const desde = new Date(Date.now() - VENTANA_MS);
  const [fallosNit, fallosIp] = await Promise.all([
    prisma.tienda_login_intentos.count({
      where: { clave: claveNit(nit), created_at: { gte: desde } },
    }),
    prisma.tienda_login_intentos.count({
      where: { clave: claveIp(ip), created_at: { gte: desde } },
    }),
  ]);
  return superaLimite(fallosNit, fallosIp);
}

export async function registrarFalloLogin(ip: string, nit: string): Promise<void> {
  await prisma.tienda_login_intentos.createMany({
    data: [{ clave: claveNit(nit) }, { clave: claveIp(ip) }],
  });
  // Limpieza oportunista de registros viejos para que la tabla no crezca.
  await prisma.tienda_login_intentos.deleteMany({
    where: { created_at: { lt: new Date(Date.now() - RETENCION_MS) } },
  });
}

export async function limpiarFallosNit(nit: string): Promise<void> {
  await prisma.tienda_login_intentos.deleteMany({ where: { clave: claveNit(nit) } });
}
