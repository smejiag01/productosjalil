import { cn } from "@/lib/cn";

/** Bloque de carga con brillo animado. Se dimensiona con className (h-*, w-*). */
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton animate-shimmer rounded-control", className)}
    />
  );
}
