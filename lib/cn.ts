/** Une clases de Tailwind ignorando los valores vacíos (sin dependencias). */
export function cn(...partes: Array<string | false | null | undefined>): string {
  return partes.filter(Boolean).join(" ");
}
