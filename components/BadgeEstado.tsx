import { ESTADOS, type EstadoPedido } from "@/lib/pedidos";

export default function BadgeEstado({ estado }: { estado: string }) {
  const config = ESTADOS[estado as EstadoPedido] ?? ESTADOS.pendiente;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
