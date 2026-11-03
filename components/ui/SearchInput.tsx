"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { inputClass } from "./clases";
import { Search, X } from "./icons";

interface Props
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value: string;
  onChange: (valor: string) => void;
  /** Texto de accesibilidad: el campo no lleva etiqueta visible. */
  label: string;
}

/** Buscador con lupa y botón de limpiar (aparece solo cuando hay texto). */
export default function SearchInput({ value, onChange, label, className, ...resto }: Props) {
  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
      />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass({ className: "pl-9 pr-10 [&::-webkit-search-cancel-button]:hidden" })}
        {...resto}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-control text-ink-600 hover:bg-ink-100"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
