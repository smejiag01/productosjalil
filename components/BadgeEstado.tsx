import StatusBadge from "@/components/ui/StatusBadge";

/** Compatibilidad: las pantallas existentes siguen usando BadgeEstado; ahora dibuja el StatusBadge del sistema. */
export default function BadgeEstado({ estado }: { estado: string }) {
  return <StatusBadge estado={estado} />;
}
