import { cn } from "@/lib/cn";

const TAMANOS = { sm: "h-4 w-4 border-2", md: "h-5 w-5 border-2", lg: "h-8 w-8 border-[3px]" };

/** Hereda el color del texto (border-current), así sirve dentro de cualquier botón. */
export default function Spinner({
  size = "md",
  className,
  label = "Cargando",
}: {
  size?: keyof typeof TAMANOS;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        TAMANOS[size],
        className
      )}
    />
  );
}
