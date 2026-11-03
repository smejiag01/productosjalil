import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const RELLENO = { none: "", sm: "p-3", md: "p-4 sm:p-5", lg: "p-5 sm:p-6" } as const;

export default function Card({
  padding = "md",
  className,
  ...resto
}: HTMLAttributes<HTMLDivElement> & { padding?: keyof typeof RELLENO }) {
  return (
    <div
      className={cn(
        "rounded-card border border-ink-200 bg-white shadow-card",
        RELLENO[padding],
        className
      )}
      {...resto}
    />
  );
}
