import { etiquetaDia, fechaValida, resolverFecha, textoFechaLarga } from "@/lib/repartidor-fechas";

const HOY = "2026-11-04"; // miércoles

describe("fechaValida", () => {
  it("acepta fechas reales", () => {
    expect(fechaValida("2026-11-04")).toBe(true);
    expect(fechaValida("2028-02-29")).toBe(true); // bisiesto
  });

  it("rechaza fechas imposibles o mal formadas", () => {
    expect(fechaValida("2026-02-31")).toBe(false);
    expect(fechaValida("2026-13-01")).toBe(false);
    expect(fechaValida("2027-02-29")).toBe(false);
    expect(fechaValida("hoy")).toBe(false);
    expect(fechaValida("2026-1-4")).toBe(false);
    expect(fechaValida("")).toBe(false);
    expect(fechaValida(undefined)).toBe(false);
  });
});

describe("resolverFecha", () => {
  it("usa la fecha pedida si es válida y hoy si no", () => {
    expect(resolverFecha("2026-12-24", HOY)).toBe("2026-12-24");
    expect(resolverFecha("basura", HOY)).toBe(HOY);
    expect(resolverFecha(undefined, HOY)).toBe(HOY);
  });
});

describe("etiquetaDia", () => {
  it("nombra hoy, mañana y ayer", () => {
    expect(etiquetaDia("2026-11-04", HOY)).toBe("Hoy");
    expect(etiquetaDia("2026-11-05", HOY)).toBe("Mañana");
    expect(etiquetaDia("2026-11-03", HOY)).toBe("Ayer");
  });

  it("para otros días da la fecha larga", () => {
    expect(etiquetaDia("2026-11-10", HOY)).toBe("martes, 10 de noviembre");
  });

  it("cruza el fin de mes sin errores", () => {
    expect(etiquetaDia("2026-12-01", "2026-11-30")).toBe("Mañana");
  });
});

describe("textoFechaLarga", () => {
  it("agrega el año solo si cambia", () => {
    expect(textoFechaLarga("2026-11-10", HOY)).toBe("martes, 10 de noviembre");
    expect(textoFechaLarga("2027-01-05", HOY)).toContain("2027");
  });
});
