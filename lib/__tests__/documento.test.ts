import { documentoValido, identificarIngreso, normalizarDocumento } from "@/lib/documento";

describe("normalizarDocumento", () => {
  it("quita puntos, espacios y guiones y pasa a mayúsculas", () => {
    expect(normalizarDocumento("1.088.123.456")).toBe("1088123456");
    expect(normalizarDocumento(" 1088 123-456 ")).toBe("1088123456");
    expect(normalizarDocumento("ab12345")).toBe("AB12345");
  });
});

describe("documentoValido", () => {
  it("acepta de 5 a 15 letras o números", () => {
    expect(documentoValido("12345")).toBe(true);
    expect(documentoValido("AB1234567")).toBe(true);
    expect(documentoValido("1234")).toBe(false);
    expect(documentoValido("1234567890123456")).toBe(false);
    expect(documentoValido("12345/6")).toBe(false);
  });
});

describe("identificarIngreso", () => {
  it("reconoce documento o correo", () => {
    expect(identificarIngreso("1.088.123.456")).toEqual({ tipo: "documento", documento: "1088123456" });
    expect(identificarIngreso(" Admin@Jalil.co ")).toEqual({ tipo: "correo", correo: "admin@jalil.co" });
  });
  it("devuelve null si está vacío o no es válido", () => {
    expect(identificarIngreso("   ")).toBeNull();
    expect(identificarIngreso("12")).toBeNull();
  });
});
