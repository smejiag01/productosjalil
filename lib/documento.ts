/**
 * Número de documento para ingresar al panel (cédula, cédula de extranjería o
 * pasaporte). Se guarda normalizado: sin puntos, espacios ni guiones y en
 * mayúsculas, para que "1.088.123.456" y "1088123456" sean el mismo.
 */
export function normalizarDocumento(valor: string): string {
  return valor.replace(/[\s.\-]/g, "").toUpperCase();
}

/** Documento ya normalizado válido: 5 a 15 letras o números. */
export function documentoValido(normalizado: string): boolean {
  return /^[0-9A-Z]{5,15}$/.test(normalizado);
}

/**
 * Qué escribió la persona en el campo de ingreso: si trae "@" es un correo
 * (se acepta mientras se completan los documentos de todos los usuarios).
 */
export function identificarIngreso(valor: string):
  | { tipo: "correo"; correo: string }
  | { tipo: "documento"; documento: string }
  | null {
  const limpio = valor.trim();
  if (!limpio) return null;
  if (limpio.includes("@")) return { tipo: "correo", correo: limpio.toLowerCase() };
  const documento = normalizarDocumento(limpio);
  return documentoValido(documento) ? { tipo: "documento", documento } : null;
}
