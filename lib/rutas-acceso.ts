/**
 * ¿La ruta pertenece al mini-dashboard del repartidor (/repartidor y sus
 * subrutas)? Ojo: "/repartidores" es el módulo ADMIN para administrar
 * repartidores y NO es del repartidor, aunque empiece igual. Un
 * startsWith("/repartidor") a secas confunde ambas.
 */
export function esRutaRepartidor(pathname: string): boolean {
  return pathname === "/repartidor" || pathname.startsWith("/repartidor/");
}
