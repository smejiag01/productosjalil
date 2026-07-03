export type EstadoPedido =
  | "pendiente"
  | "en_proceso"
  | "confirmado"
  | "en_reparto"
  | "entregado"
  | "devuelto"
  | "cancelado";

export const ESTADOS: Record<
  EstadoPedido,
  { label: string; color: string; bg: string; dot: string }
> = {
  pendiente: {
    label: "Pendiente",
    color: "text-yellow-800",
    bg: "bg-yellow-50 border-yellow-200",
    dot: "bg-yellow-500",
  },
  en_proceso: {
    label: "En proceso",
    color: "text-blue-800",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  },
  confirmado: {
    label: "Confirmado",
    color: "text-green-800",
    bg: "bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
  en_reparto: {
    label: "En reparto",
    color: "text-purple-800",
    bg: "bg-purple-50 border-purple-200",
    dot: "bg-purple-500",
  },
  entregado: {
    label: "Entregado",
    color: "text-gray-800",
    bg: "bg-gray-50 border-gray-200",
    dot: "bg-gray-500",
  },
  devuelto: {
    label: "Devuelto",
    color: "text-orange-800",
    bg: "bg-orange-50 border-orange-200",
    dot: "bg-orange-500",
  },
  cancelado: {
    label: "Cancelado",
    color: "text-red-800",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
};

// Nota: "confirmado" -> en_reparto/devuelto existen para el flujo del repartidor
// (ver /api/pedidos/[id]/estado). El admin (BotonesEstado) filtra esas dos
// opciones para no alterar los botones que ya ve hoy.
export const TRANSICIONES_VALIDAS: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ["en_proceso", "cancelado"],
  en_proceso: ["confirmado", "cancelado"],
  confirmado: ["entregado", "en_reparto", "devuelto"],
  en_reparto: ["entregado", "devuelto", "cancelado"],
  entregado: [],
  devuelto: [],
  cancelado: [],
};

export function esTransicionValida(
  actual: EstadoPedido,
  nuevo: EstadoPedido
): boolean {
  return TRANSICIONES_VALIDAS[actual]?.includes(nuevo) ?? false;
}
