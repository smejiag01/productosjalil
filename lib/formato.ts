export function formatearPrecio(valor: number | string): string {
  const numero = typeof valor === "string" ? parseFloat(valor) : valor;
  return `$${numero.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** "573163332739" → "316 333 2739" (si no tiene al menos 10 dígitos, lo devuelve igual). */
export function formatearCelularCO(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length < 10) return valor;
  const d = digitos.slice(-10);
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
