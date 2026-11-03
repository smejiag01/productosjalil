import { cn } from "@/lib/cn";
import { ESTADOS, type EstadoPedido, type IconoEstado } from "@/lib/pedidos";
import {
  CheckCircle2,
  Clock,
  Cog,
  PackageCheck,
  Truck,
  Undo2,
  XCircle,
  type LucideIcon,
} from "./icons";

const ICONOS: Record<IconoEstado, LucideIcon> = {
  reloj: Clock,
  engranaje: Cog,
  check: CheckCircle2,
  camion: Truck,
  paquete: PackageCheck,
  devolver: Undo2,
  cancelar: XCircle,
};

/**
 * Estado de un pedido. "solid" = alto contraste con ícono (repartidor, al sol);
 * "soft" = tinte con borde para tablas densas. Siempre lleva etiqueta e ícono:
 * el estado nunca se distingue solo por color.
 */
export default function StatusBadge({
  estado,
  variant = "soft",
  size = "md",
  className,
}: {
  estado: string;
  variant?: "soft" | "solid";
  size?: "md" | "lg";
  className?: string;
}) {
  const config = ESTADOS[estado as EstadoPedido] ?? ESTADOS.pendiente;
  const Icono = ICONOS[config.icon];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold",
        size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
        variant === "solid" ? cn(config.solid, "border-transparent") : config.soft,
        className
      )}
    >
      <Icono aria-hidden="true" className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {config.label}
    </span>
  );
}
