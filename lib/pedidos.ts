export type EstadoPedido =
  | "pendiente"
  | "en_proceso"
  | "confirmado"
  | "cancelado"
  | "entregado";

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
  cancelado: {
    label: "Cancelado",
    color: "text-red-800",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
  entregado: {
    label: "Entregado",
    color: "text-gray-800",
    bg: "bg-gray-50 border-gray-200",
    dot: "bg-gray-500",
  },
};

export const TRANSICIONES_VALIDAS: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ["en_proceso", "cancelado"],
  en_proceso: ["confirmado", "cancelado"],
  confirmado: ["entregado"],
  cancelado: [],
  entregado: [],
};

export function esTransicionValida(
  actual: EstadoPedido,
  nuevo: EstadoPedido
): boolean {
  return TRANSICIONES_VALIDAS[actual]?.includes(nuevo) ?? false;
}
