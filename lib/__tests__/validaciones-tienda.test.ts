import { normalizarNit, esquemaLoginNit } from "@/lib/validaciones-tienda";

describe("normalizarNit", () => {
  it("quita el dígito de verificación después del guion", () => {
    expect(normalizarNit("901234567-8")).toBe("901234567");
  });

  it("quita puntos de miles", () => {
    expect(normalizarNit("901.234.567")).toBe("901234567");
  });

  it("quita espacios", () => {
    expect(normalizarNit("  901 234 567 ")).toBe("901234567");
  });

  it("combina puntos + guion con dígito de verificación", () => {
    expect(normalizarNit("901.234.567-8")).toBe("901234567");
  });

  it("deja intacto un documento ya limpio", () => {
    expect(normalizarNit("1025461205")).toBe("1025461205");
  });

  it("maneja un guion al final sin dígito", () => {
    expect(normalizarNit("900123456-")).toBe("900123456");
  });
});

describe("esquemaLoginNit", () => {
  it("normaliza el nit al parsear", () => {
    const r = esquemaLoginNit.safeParse({ nit: "901.234.567-8" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.nit).toBe("901234567");
  });

  it("rechaza un nit vacío", () => {
    const r = esquemaLoginNit.safeParse({ nit: "   " });
    expect(r.success).toBe(false);
  });
});
