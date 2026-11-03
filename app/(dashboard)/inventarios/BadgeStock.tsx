export default function BadgeStock({
  actual,
  minimo,
}: {
  actual: number;
  minimo: number;
}) {
  const esRojo = actual <= minimo;
  const esAmarillo = !esRojo && actual <= minimo * 1.5;

  const color = esRojo
    ? "bg-danger-soft border-danger/30 text-danger"
    : esAmarillo
      ? "bg-warn-soft border-warn/30 text-warn-soft-text"
      : "bg-ok-soft border-ok/30 text-ok";

  const dot = esRojo
    ? "bg-danger"
    : esAmarillo
      ? "bg-warn"
      : "bg-ok";

  const label = esRojo ? "Bajo" : esAmarillo ? "Medio" : "OK";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
