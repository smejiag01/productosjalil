import { horaLegible, validarHorarioMensajes } from "@/lib/mensajes-programados";

describe("validarHorarioMensajes", () => {
  it("acepta un horario dentro de la franja y calcula el seguimiento", () => {
    expect(validarHorarioMensajes("08:30", 4)).toEqual({ ok: true, horaRecordatorio: "08:30", horaSeguimiento: "12:30" });
    expect(validarHorarioMensajes("06:00", 12)).toEqual({ ok: true, horaRecordatorio: "06:00", horaSeguimiento: "18:00" });
  });

  it("rechaza horas fuera de la franja de envío", () => {
    expect(validarHorarioMensajes("05:45", 2).ok).toBe(false);
    expect(validarHorarioMensajes("21:00", 1).ok).toBe(false);
  });

  it("rechaza un seguimiento que caería demasiado tarde", () => {
    const r = validarHorarioMensajes("18:00", 4);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("10:00 p. m.");
  });

  it("rechaza datos inválidos", () => {
    expect(validarHorarioMensajes("8:30", 2).ok).toBe(false);
    expect(validarHorarioMensajes("08:30", 0).ok).toBe(false);
    expect(validarHorarioMensajes("08:30", 2.5).ok).toBe(false);
    expect(validarHorarioMensajes("08:30", 13).ok).toBe(false);
  });
});

describe("horaLegible", () => {
  it("muestra la hora en formato de 12 horas", () => {
    expect(horaLegible("08:30")).toBe("8:30 a. m.");
    expect(horaLegible("12:00")).toBe("12:00 p. m.");
    expect(horaLegible("20:45")).toBe("8:45 p. m.");
  });
});
