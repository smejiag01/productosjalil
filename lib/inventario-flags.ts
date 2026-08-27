import { NextResponse } from "next/server";

/**
 * El cliente decidió manejar inventario solo de producto terminado (reunión
 * 25/08/2026) — ya no se va a llevar control de insumos, materias primas,
 * recetas ni reconteos físicos.
 *
 * Este flag oculta esas secciones del menú y del hub de Inventarios, y
 * bloquea sus páginas y endpoints para que no queden accesibles escribiendo
 * la URL directamente. No borra tablas ni código: para reactivar esta parte
 * del módulo, solo hay que volver a poner este valor en `true`.
 */
export const INVENTARIO_MATERIA_PRIMA_HABILITADO = false;

/** Respuesta estándar para los endpoints de recetas/producción/reconteos mientras el flag esté apagado. */
export function respuestaInventarioDeshabilitado() {
  return NextResponse.json(
    { success: false, error: "Esta función no está disponible" },
    { status: 404 }
  );
}
