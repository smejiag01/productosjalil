import { esquemaOperacion, fechaBogota, instanteValido } from "@/lib/visitas";

const AHORA = new Date("2026-11-09T15:00:00Z");
const ID = "3f6c1d2a-9b4e-4c1a-8f2d-1a2b3c4d5e6f";
const JORNADA = "7a8b9c0d-1e2f-4a3b-9c4d-5e6f7a8b9c0d";

describe("fechaBogota", () => {
  it("usa el día de Colombia, no el UTC", () => {
    // 2:00 a. m. UTC del 10 = 9:00 p. m. del 9 en Bogotá
    expect(fechaBogota(new Date("2026-11-10T02:00:00Z"))).toBe("2026-11-09");
    expect(fechaBogota(new Date("2026-11-10T06:00:00Z"))).toBe("2026-11-10");
  });
});

describe("instanteValido", () => {
  it("acepta horas recientes, incluso de días anteriores (registros sin señal)", () => {
    expect(instanteValido("2026-11-09T14:30:00Z", AHORA)).toBe(true);
    expect(instanteValido("2026-11-05T14:30:00Z", AHORA)).toBe(true);
  });
  it("rechaza el futuro, lo muy viejo y lo que no es fecha", () => {
    expect(instanteValido("2026-11-09T16:00:00Z", AHORA)).toBe(false);
    expect(instanteValido("2026-09-01T00:00:00Z", AHORA)).toBe(false);
    expect(instanteValido("ayer", AHORA)).toBe(false);
  });
});

describe("esquemaOperacion", () => {
  const ahoraIso = new Date().toISOString();

  it("valida el inicio de jornada", () => {
    const r = esquemaOperacion.safeParse({ tipo: "iniciar_jornada", id: JORNADA, ciudad: " Pereira ", inicio_at: ahoraIso, lat: 4.81, lng: -75.69 });
    expect(r.success).toBe(true);
    if (r.success && r.data.tipo === "iniciar_jornada") expect(r.data.ciudad).toBe("Pereira");
  });

  it("valida una visita y deja en null los campos vacíos", () => {
    const r = esquemaOperacion.safeParse({
      tipo: "visita",
      id: ID,
      jornada_id: JORNADA,
      registrada_at: ahoraIso,
      nicho: "Pizzería",
      nombre_empresa: "Pizza Y +",
      direccion: "",
      telefono: "3123703764",
      contacto: "Andrés",
      observaciones: "  ",
    });
    expect(r.success).toBe(true);
    if (r.success && r.data.tipo === "visita") {
      expect(r.data.direccion).toBeNull();
      expect(r.data.observaciones).toBeNull();
      expect(r.data.telefono).toBe("3123703764");
    }
  });

  it("exige nombre del negocio, tipo de negocio e ids válidos", () => {
    expect(esquemaOperacion.safeParse({ tipo: "visita", id: ID, jornada_id: JORNADA, registrada_at: ahoraIso, nicho: "Pizzería", nombre_empresa: "" }).success).toBe(false);
    expect(esquemaOperacion.safeParse({ tipo: "visita", id: "123", jornada_id: JORNADA, registrada_at: ahoraIso, nicho: "Pizzería", nombre_empresa: "X Y" }).success).toBe(false);
    expect(esquemaOperacion.safeParse({ tipo: "otra_cosa", id: ID }).success).toBe(false);
  });

  it("rechaza coordenadas fuera de rango", () => {
    expect(esquemaOperacion.safeParse({ tipo: "finalizar_jornada", id: JORNADA, fin_at: ahoraIso, lat: 120, lng: 0 }).success).toBe(false);
  });
});
