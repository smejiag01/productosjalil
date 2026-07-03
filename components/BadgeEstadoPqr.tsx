import { ESTADOS_PQR, type EstadoPqr } from "@/lib/pqrs";

export default function BadgeEstadoPqr({ estado }: { estado: string }) {
  const config = ESTADOS_PQR[estado as EstadoPqr] ?? ESTADOS_PQR.pendiente;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
