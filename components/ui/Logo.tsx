import Image from "next/image";
import { cn } from "@/lib/cn";

type Tono = "brand" | "cream" | "ink";
type Variante = "mark" | "lockup" | "stacked";

// Proporción del logo recortado (640 × 540 px)
const PROPORCION = 640 / 540;

/**
 * Logo oficial de Productos Jalil (óvalo con el toro). Ya trae el nombre y el
 * lema, así que se usa solo; `size` es el alto en px. `tone` se conserva por
 * compatibilidad: el logo es a todo color y se ve bien sobre fondos claros y
 * oscuros, por eso no cambia.
 */
export function MarcaPJ({
  size = 40,
  className,
  title,
}: {
  size?: number;
  tone?: Tono;
  className?: string;
  title?: string;
}) {
  return (
    <Image
      src="/logo-jalil.png"
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      width={Math.round(size * PROPORCION)}
      height={size}
      unoptimized
      priority={size >= 48}
      className={cn("flex-shrink-0 object-contain", className)}
    />
  );
}

/** Marca de la casa. Todas las variantes muestran el logo oficial. */
export default function Logo({
  size = 40,
  className,
}: {
  variant?: Variante;
  tone?: Tono;
  size?: number;
  className?: string;
}) {
  return <MarcaPJ size={size} title="Productos Jalil" className={className} />;
}
