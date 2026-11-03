import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { inputClass, textareaClass } from "./clases";

interface ComunesCampo {
  invalid?: boolean;
}

export function Input({
  invalid,
  className,
  ...resto
}: InputHTMLAttributes<HTMLInputElement> & ComunesCampo) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={inputClass({ invalid, className })}
      {...resto}
    />
  );
}

export function Textarea({
  invalid,
  className,
  ...resto
}: TextareaHTMLAttributes<HTMLTextAreaElement> & ComunesCampo) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={textareaClass({ invalid, className })}
      {...resto}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...resto
}: SelectHTMLAttributes<HTMLSelectElement> & ComunesCampo) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={inputClass({ invalid, className: cn("pr-8", className) })}
      {...resto}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  className,
  ...resto
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
  return (
    <label className={cn("inline-flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm text-ink-800", className)}>
      <input
        type="checkbox"
        className="h-5 w-5 rounded border-ink-300 text-brand accent-[#BC4220] focus:ring-2 focus:ring-brand/20"
        {...resto}
      />
      {label}
    </label>
  );
}
