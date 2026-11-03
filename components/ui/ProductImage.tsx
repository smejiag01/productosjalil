"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { MarcaPJ } from "./Logo";

/**
 * Imagen de producto: carga con brillo de esqueleto, aparece con fundido y, si
 * no hay foto (o falla), muestra el monograma PJ como marca de agua. La foto ya
 * se optimiza al subirla (sharp), por eso se usa `unoptimized` y no se gasta la
 * cuota de optimización de imágenes de Vercel. El tamaño lo da el padre
 * (aspect-*, h-*, w-*) vía className.
 */
export default function ProductImage({
  src,
  alt,
  className,
  sizes = "(min-width:1024px) 25vw, 50vw",
  priority,
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [cargada, setCargada] = useState(false);
  const [fallo, setFallo] = useState(false);
  const hayImagen = !!src && !fallo;

  return (
    <div className={cn("relative overflow-hidden bg-ink-100", className)}>
      {hayImagen ? (
        <>
          {!cargada && <div aria-hidden="true" className="skeleton absolute inset-0 animate-shimmer" />}
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            unoptimized
            priority={priority}
            onLoad={() => setCargada(true)}
            onError={() => setFallo(true)}
            className={cn(
              "object-cover transition-opacity duration-300",
              cargada ? "opacity-100" : "opacity-0"
            )}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <MarcaPJ size={48} tone="ink" className="opacity-[.08]" />
        </div>
      )}
    </div>
  );
}
