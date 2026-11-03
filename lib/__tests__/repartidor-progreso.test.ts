import {
  calcularProgreso,
  estaListaParaEntrega,
  estaResuelta,
  numerarParadas,
  siguienteParada,
} from "@/lib/repartidor-progreso";

describe("estaResuelta / estaListaParaEntrega", () => {
  it("entregado y devuelto ya están resueltos", () => {
    expect(estaResuelta("entregado")).toBe(true);
    expect(estaResuelta("devuelto")).toBe(true);
    expect(estaResuelta("confirmado")).toBe(false);
    expect(estaResuelta("pendiente")).toBe(false);
  });

  it("solo confirmado y en_reparto están listos para entregar", () => {
    expect(estaListaParaEntrega("confirmado")).toBe(true);
    expect(estaListaParaEntrega("en_reparto")).toBe(true);
    expect(estaListaParaEntrega("pendiente")).toBe(false);
    expect(estaListaParaEntrega("en_proceso")).toBe(false);
    expect(estaListaParaEntrega("entregado")).toBe(false);
  });
});

describe("calcularProgreso", () => {
  it("cuenta entregadas y devueltas como avance", () => {
    const p = calcularProgreso([
      { id: "a", estado: "entregado" },
      { id: "b", estado: "devuelto" },
      { id: "c", estado: "confirmado" },
      { id: "d", estado: "en_reparto" },
    ]);
    expect(p).toEqual({ total: 4, resueltas: 2, pendientes: 2, porcentaje: 50 });
  });

  it("redondea el porcentaje", () => {
    const p = calcularProgreso([
      { id: "a", estado: "entregado" },
      { id: "b", estado: "confirmado" },
      { id: "c", estado: "confirmado" },
    ]);
    expect(p.porcentaje).toBe(33);
  });

  it("sin entregas no divide entre cero", () => {
    expect(calcularProgreso([])).toEqual({ total: 0, resueltas: 0, pendientes: 0, porcentaje: 0 });
  });
});

describe("siguienteParada", () => {
  it("es la primera lista para entregar, saltando las resueltas y las que aún no están listas", () => {
    const id = siguienteParada([
      { id: "a", estado: "entregado" },
      { id: "b", estado: "pendiente" },
      { id: "c", estado: "confirmado" },
      { id: "d", estado: "en_reparto" },
    ]);
    expect(id).toBe("c");
  });

  it("devuelve null si no queda ninguna lista", () => {
    expect(siguienteParada([{ id: "a", estado: "entregado" }])).toBeNull();
    expect(siguienteParada([])).toBeNull();
  });
});

describe("numerarParadas", () => {
  it("numera de 1 en adelante dentro de cada ruta", () => {
    const n = numerarParadas([
      { id: "a", estado: "confirmado", rutaId: "r1" },
      { id: "b", estado: "confirmado", rutaId: "r2" },
      { id: "c", estado: "confirmado", rutaId: "r1" },
      { id: "d", estado: "confirmado", rutaId: "r2" },
    ]);
    expect(n.get("a")).toBe(1);
    expect(n.get("c")).toBe(2);
    expect(n.get("b")).toBe(1);
    expect(n.get("d")).toBe(2);
  });
});
