export type EstadoPedido =
  | "pendiente"
  | "en_proceso"
  | "confirmado"
  | "en_reparto"
  | "entregado"
  | "devuelto"
  | "cancelado";

/** Nombre del ícono de cada estado (components/ui/StatusBadge lo traduce a lucide). */
export type IconoEstado =
  | "reloj"
  | "engranaje"
  | "check"
  | "camion"
  | "paquete"
  | "devolver"
  | "cancelar";

export interface ConfigEstado {
  label: string;
  /** Claves originales (insignias suaves antiguas): se conservan mientras se migra. */
  color: string;
  bg: string;
  dot: string;
  /** Insignia sólida de alto contraste (legible al sol). Pares validados en el test de contraste. */
  solid: string;
  /** Insignia suave con borde, para tablas densas del admin. */
  soft: string;
  icon: IconoEstado;
}

export const ESTADOS: Record<EstadoPedido, ConfigEstado> = {
  pendiente: {
    label: "Pendiente",
    color: "text-yellow-800",
    bg: "bg-yellow-50 border-yellow-200",
    dot: "bg-yellow-500",
    solid: "bg-estado-pendiente text-ink-900",
    soft: "bg-warn-soft text-warn-soft-text border-warn/50",
    icon: "reloj",
  },
  en_proceso: {
    label: "En proceso",
    color: "text-blue-800",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    solid: "bg-estado-en-proceso text-white",
    soft: "bg-info-soft text-info border-info/30",
    icon: "engranaje",
  },
  confirmado: {
    label: "Confirmado",
    color: "text-green-800",
    bg: "bg-green-50 border-green-200",
    dot: "bg-green-500",
    solid: "bg-estado-confirmado text-white",
    soft: "bg-ok-soft text-ok border-ok/30",
    icon: "check",
  },
  en_reparto: {
    label: "En reparto",
    color: "text-purple-800",
    bg: "bg-purple-50 border-purple-200",
    dot: "bg-purple-500",
    solid: "bg-estado-en-reparto text-white",
    soft: "bg-[#EFE9F8] text-estado-en-reparto border-estado-en-reparto/30",
    icon: "camion",
  },
  entregado: {
    label: "Entregado",
    color: "text-gray-800",
    bg: "bg-gray-50 border-gray-200",
    dot: "bg-gray-500",
    solid: "bg-estado-entregado text-white",
    soft: "bg-ink-100 text-estado-entregado border-ink-300",
    icon: "paquete",
  },
  devuelto: {
    label: "Devuelto",
    color: "text-orange-800",
    bg: "bg-orange-50 border-orange-200",
    dot: "bg-orange-500",
    solid: "bg-estado-devuelto text-white",
    soft: "bg-[#FDEBD7] text-estado-devuelto border-estado-devuelto/30",
    icon: "devolver",
  },
  cancelado: {
    label: "Cancelado",
    color: "text-red-800",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    solid: "bg-estado-cancelado text-white",
    soft: "bg-danger-soft text-danger border-danger/30",
    icon: "cancelar",
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

// Retroceso de un paso para el control de estado compacto del listado de
// pedidos (deshacer). Es independiente de TRANSICIONES_VALIDAS a propósito:
// esa tabla se usa también para generar los botones de avance en el detalle
// del pedido, y un retroceso no debe aparecer ahí como una acción más.
export const ESTADO_ANTERIOR: Partial<Record<EstadoPedido, EstadoPedido>> = {
  en_proceso: "pendiente",
  confirmado: "en_proceso",
  entregado: "confirmado",
};

export function esRetrocesoValido(
  actual: EstadoPedido,
  nuevo: EstadoPedido
): boolean {
  return ESTADO_ANTERIOR[actual] === nuevo;
}

// Un pedido solo se puede modificar (agregar/quitar/cambiar cantidad de
// productos) mientras todavía no salió a reparto ni se cerró su ciclo.
export const ESTADOS_MODIFICABLES: EstadoPedido[] = ["pendiente", "en_proceso", "confirmado"];

export function esPedidoModificable(estado: EstadoPedido): boolean {
  return ESTADOS_MODIFICABLES.includes(estado);
}
