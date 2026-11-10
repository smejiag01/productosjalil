import { calcularHabituales, esquemaDestacados, moverEnLista, type LineaHistorial } from "@/lib/destacados";

const A = "3f6c1d2a-9b4e-4c1a-8f2d-1a2b3c4d5e6f";
const B = "7a8b9c0d-1e2f-4a3b-9c4d-5e6f7a8b9c0d";

describe("esquemaDestacados", () => {
  it("acepta una lista ordenada de ids, incluso vacía", () => {
    expect(esquemaDestacados.safeParse({ ids: [A, B] }).success).toBe(true);
    expect(esquemaDestacados.safeParse({ ids: [] }).success).toBe(true);
  });
  it("rechaza repetidos, ids inválidos y más del máximo", () => {
    expect(esquemaDestacados.safeParse({ ids: [A, A] }).success).toBe(false);
    expect(esquemaDestacados.safeParse({ ids: ["123"] }).success).toBe(false);
    const nueve = Array.from({ length: 9 }, (_, i) => `3f6c1d2a-9b4e-4c1a-8f2d-1a2b3c4d5e6${i}`);
    expect(esquemaDestacados.safeParse({ ids: nueve }).success).toBe(false);
  });
});

describe("moverEnLista", () => {
  it("intercambia con el vecino y no se sale de los bordes", () => {
    expect(moverEnLista(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moverEnLista(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
    expect(moverEnLista(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moverEnLista(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });
});

describe("calcularHabituales", () => {
  const d = (dia: number) => new Date(`2026-11-0${dia}T12:00:00Z`);
  const linea = (pedido: string, producto: string, dia: number): LineaHistorial => ({
    pedido_id: pedido,
    producto_id: producto,
    fecha: d(dia),
  });

  it("ordena por cuántos pedidos incluyen el producto y exige al menos 2", () => {
    const lineas = [
      linea("p1", "chorizo", 1),
      linea("p1", "costilla", 1),
      linea("p2", "chorizo", 2),
      linea("p2", "costilla", 2),
      linea("p3", "chorizo", 3),
      linea("p3", "lomo", 3),
    ];
    const activos = new Set(["chorizo", "costilla", "lomo"]);
    expect(calcularHabituales(lineas, activos)).toEqual(["chorizo", "costilla"]);
  });

  it("cuenta una vez el producto repetido en el mismo pedido y desempata por lo más reciente", () => {
    const lineas = [
      linea("p1", "a", 1),
      linea("p1", "a", 1),
      linea("p2", "a", 2),
      linea("p1", "b", 1),
      linea("p3", "b", 3),
    ];
    expect(calcularHabituales(lineas, new Set(["a", "b"]))).toEqual(["b", "a"]);
  });

  it("deja fuera productos inactivos y respeta el límite", () => {
    const lineas = ["x", "y", "z"].flatMap((p) => [linea("p1", p, 1), linea("p2", p, 2)]);
    expect(calcularHabituales(lineas, new Set(["x", "z"]))).toEqual(["x", "z"]);
    expect(calcularHabituales(lineas, new Set(["x", "y", "z"]), 2)).toHaveLength(2);
  });
});
