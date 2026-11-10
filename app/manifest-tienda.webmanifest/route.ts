import { MANIFIESTO_TIENDA, respuestaManifiesto } from "@/lib/manifiestos";

// Fuera de /tienda para que el middleware no lo mande al login de la tienda.
export function GET() {
  return respuestaManifiesto(MANIFIESTO_TIENDA);
}
