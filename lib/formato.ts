export function formatearPrecio(valor: number | string): string {
  const numero = typeof valor === "string" ? parseFloat(valor) : valor;
  return `$${numero.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
