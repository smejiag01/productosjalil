/**
 * ¿La ruta pertenece al mini-dashboard del repartidor (/repartidor y sus
 * subrutas)? Ojo: "/repartidores" es el módulo ADMIN para administrar
 * repartidores y NO es del repartidor, aunque empiece igual. Un
 * startsWith("/repartidor") a secas confunde ambas.
 */
export function esRutaRepartidor(pathname: string): boolean {
  return pathname === "/repartidor" || pathname.startsWith("/repartidor/");
}

/** ¿La ruta pertenece a la app del vendedor (/vendedor y sus subrutas)? */
export function esRutaVendedor(pathname: string): boolean {
  return pathname === "/vendedor" || pathname.startsWith("/vendedor/");
}

/** Pantalla de inicio de cada rol después de iniciar sesión. */
export function rutaInicioPorRol(rol: string | undefined): string {
  if (rol === "repartidor") return "/repartidor";
  if (rol === "vendedor") return "/vendedor";
  return "/";
}

/**
 * Si el rol no puede estar en esa ruta, a dónde mandarlo; null si puede.
 * Repartidor y vendedor solo ven su app; el admin no entra a esas apps.
 */
export function redireccionPorRol(rol: string | undefined, pathname: string): string | null {
  const enRepartidor = esRutaRepartidor(pathname);
  const enVendedor = esRutaVendedor(pathname);
  if (rol === "repartidor") return enRepartidor ? null : "/repartidor";
  if (rol === "vendedor") return enVendedor ? null : "/vendedor";
  if (enRepartidor || enVendedor) return "/";
  return null;
}
