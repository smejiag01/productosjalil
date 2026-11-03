import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BADGE_SOLIDO, BADGE_SUAVE, type TonoBadge } from "./clases";

export default function Badge({
  tone = "neutral",
  variant = "soft",
  icon,
  dot,
  className,
  children,
}: {
  tone?: TonoBadge;
  variant?: "soft" | "solid";
  icon?: ReactNode;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold",
        variant === "solid" ? BADGE_SOLIDO[tone] : BADGE_SUAVE[tone],
        className
      )}
    >
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {icon}
      {children}
    </span>
  );
}
