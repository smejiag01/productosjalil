import { elegirCategoriaActiva, partirEtiquetaFecha } from "@/lib/tienda-ui";

describe("elegirCategoriaActiva (scroll-spy)", () => {
  const secciones = [
    { id: "tocinetas", top: -420 },
    { id: "embutidos", top: 80 },
    { id: "cerdo", top: 640 },
  ];

  it("sin secciones no hay categoría activa", () => {
    expect(elegirCategoriaActiva([], 120)).toBeNull();
  });

  it("elige la última sección cuyo borde ya pasó el umbral", () => {
    // tocinetas y embutidos (80 <= 120) ya pasaron; cerdo (640) todavía no
    expect(elegirCategoriaActiva(secciones, 120)).toBe("embutidos");
  });

  it("si ninguna ha llegado al umbral, queda la primera", () => {
    expect(
      elegirCategoriaActiva(
        [
          { id: "a", top: 300 },
          { id: "b", top: 900 },
        ],
        120
      )
    ).toBe("a");
  });

  it("al final de la página gana la última, aunque sea corta", () => {
    expect(elegirCategoriaActiva(secciones, 120, true)).toBe("cerdo");
  });

  it("una sección justo en el umbral cuenta como activa", () => {
    expect(elegirCategoriaActiva(secciones, 640)).toBe("cerdo");
  });
});

describe("partirEtiquetaFecha", () => {
  it("separa el día de la semana del resto", () => {
    expect(partirEtiquetaFecha("Viernes, 25 de septiembre")).toEqual({
      dia: "Viernes",
      fecha: "25 de septiembre",
    });
  });

  it("si no hay coma, deja todo como día", () => {
    expect(partirEtiquetaFecha("Mañana")).toEqual({ dia: "Mañana", fecha: "" });
  });
});
