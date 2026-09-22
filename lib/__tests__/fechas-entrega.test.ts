import { proximasFechasEntrega } from "@/lib/fechas-entrega";

function diaSemana(fechaStr: string): number {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

describe("proximasFechasEntrega", () => {
  it("empieza mañana y va en orden ascendente (ruta todos los días)", () => {
    const fechas = proximasFechasEntrega(
      { dias_semana: [0, 1, 2, 3, 4, 5, 6], frecuencia: "semanal", fecha_base: null },
      3,
      "2026-09-21"
    );
    expect(fechas).toEqual(["2026-09-22", "2026-09-23", "2026-09-24"]);
  });

  it("solo devuelve días de la semana en que sale la ruta", () => {
    const fechas = proximasFechasEntrega(
      { dias_semana: [2], frecuencia: "semanal", fecha_base: null }, // martes
      10,
      "2026-09-21"
    );
    // En una ventana de ~21 días caben 3 martes.
    expect(fechas).toEqual(["2026-09-22", "2026-09-29", "2026-10-06"]);
    for (const f of fechas) {
      expect(diaSemana(f)).toBe(2);
    }
    // estrictamente ascendentes
    const ordenadas = [...fechas].sort();
    expect(fechas).toEqual(ordenadas);
  });

  it("no ofrece nada si la ruta no tiene días", () => {
    const fechas = proximasFechasEntrega(
      { dias_semana: [], frecuencia: "semanal", fecha_base: null },
      5,
      "2026-09-21"
    );
    expect(fechas).toEqual([]);
  });

  it("quincenal: solo las fechas en fase con fecha_base (múltiplos de 14 días)", () => {
    const fechaBase = new Date(Date.UTC(2026, 8, 2)); // miércoles 2026-09-02
    const fechas = proximasFechasEntrega(
      { dias_semana: [3], frecuencia: "quincenal", fecha_base: fechaBase }, // miércoles
      5,
      "2026-09-03"
    );
    const baseMs = Date.UTC(2026, 8, 2);
    for (const f of fechas) {
      expect(diaSemana(f)).toBe(3);
      const [y, m, d] = f.split("-").map(Number);
      const diff = Math.round((Date.UTC(y, m - 1, d) - baseMs) / 86400000);
      expect(diff % 14).toBe(0);
    }
    // El primer miércoles en fase después de hoy es 2026-09-16 (base + 14).
    expect(fechas[0]).toBe("2026-09-16");
  });
});
