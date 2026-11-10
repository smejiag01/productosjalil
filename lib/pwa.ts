/**
 * Borra las pantallas guardadas por el service worker (public/sw.js). Se
 * llama al cerrar sesión para que el siguiente usuario del celular no vea,
 * sin señal, los datos del anterior.
 */
export async function borrarCacheApp(): Promise<void> {
  try {
    if (typeof caches === "undefined") return;
    const claves = await caches.keys();
    await Promise.all(claves.filter((c) => c.startsWith("jalil-")).map((c) => caches.delete(c)));
  } catch {
    // Si el navegador no deja tocar la caché, se cierra sesión igual.
  }
}
