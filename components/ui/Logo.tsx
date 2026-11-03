import { cn } from "@/lib/cn";

type Tono = "brand" | "cream" | "ink";
type Variante = "mark" | "lockup" | "stacked";

const COLORES: Record<Tono, { sello: string; letras: string; anillo: string; texto: string }> = {
  brand: { sello: "#BC4220", letras: "#F8F3EA", anillo: "#F8F3EA", texto: "#231815" },
  cream: { sello: "#F8F3EA", letras: "#BC4220", anillo: "#BC4220", texto: "#F8F3EA" },
  ink: { sello: "#231815", letras: "#F8F3EA", anillo: "#F8F3EA", texto: "#231815" },
};

/**
 * Sello cuadrado con la ligadura P+J: la J se engancha bajo el bucle de la P
 * (como un sello de carnicería) y un punto dorado cierra el gancho. Trazos
 * SVG, así no depende de ninguna fuente y escala sin perder nitidez.
 */
export function MarcaPJ({
  size = 40,
  tone = "brand",
  className,
  title,
}: {
  size?: number;
  tone?: Tono;
  className?: string;
  title?: string;
}) {
  const c = COLORES[tone];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("flex-shrink-0", className)}
    >
      <rect width="64" height="64" rx="14" fill={c.sello} />
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="10.5"
        fill="none"
        stroke={c.anillo}
        strokeOpacity=".55"
        strokeWidth="1.25"
      />
      {/* P: asta y bucle */}
      <path
        d="M20 47V16h11a9.5 9.5 0 0 1 0 19H20"
        fill="none"
        stroke={c.letras}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* J: asta y gancho que se mete bajo la P */}
      <path
        d="M44 16v23a8 8 0 0 1-8 8H31"
        fill="none"
        stroke={c.letras}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="47" r="2.3" fill="#E0A526" />
    </svg>
  );
}

/** Marca de la casa: sello solo, o con el nombre ("lockup" en línea, "stacked" apilado). */
export default function Logo({
  variant = "lockup",
  tone = "brand",
  size = 40,
  className,
}: {
  variant?: Variante;
  tone?: Tono;
  size?: number;
  className?: string;
}) {
  if (variant === "mark") {
    return <MarcaPJ size={size} tone={tone} title="Productos Jalil" className={className} />;
  }

  const texto = COLORES[tone].texto;
  const apilado = variant === "stacked";

  return (
    <div
      className={cn(
        "flex items-center",
        apilado ? "flex-col gap-3 text-center" : "gap-3",
        className
      )}
    >
      <MarcaPJ size={size} tone={tone} />
      <div className={apilado ? "" : "min-w-0"}>
        <p
          className="font-display font-semibold leading-none"
          style={{ color: texto, fontSize: Math.round(size * (apilado ? 0.5 : 0.45)) }}
        >
          Productos Jalil
        </p>
        <p
          className="mt-1 font-medium uppercase"
          style={{
            color: texto,
            opacity: 0.75,
            fontSize: Math.max(9, Math.round(size * 0.22)),
            letterSpacing: "0.18em",
          }}
        >
          Tradición artesanal
        </p>
      </div>
    </div>
  );
}
