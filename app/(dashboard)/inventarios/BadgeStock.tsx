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
    ? "bg-red-50 border-red-200 text-red-800"
    : esAmarillo
      ? "bg-yellow-50 border-yellow-200 text-yellow-800"
      : "bg-green-50 border-green-200 text-green-800";

  const dot = esRojo
    ? "bg-red-500"
    : esAmarillo
      ? "bg-yellow-500"
      : "bg-green-500";

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
