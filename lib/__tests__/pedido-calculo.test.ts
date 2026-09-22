import { calcularLineas, redondear } from "@/lib/pedido-calculo";

describe("calcularLineas", () => {
  it("calcula subtotales por línea y el total", () => {
    const { lineas, total } = calcularLineas([
      { producto_id: "a", producto_nombre: "Tocineta", cantidad: 2, precio_unitario: 1500 },
      { producto_id: "b", producto_nombre: "Chorizo", cantidad: 3, precio_unitario: 1000 },
    ]);
    expect(lineas[0].subtotal).toBe(3000);
    expect(lineas[1].subtotal).toBe(3000);
    expect(total).toBe(6000);
  });

  it("redondea a 2 decimales", () => {
    const { total } = calcularLineas([
      { producto_id: "a", producto_nombre: "X", cantidad: 3, precio_unitario: 1000.333 },
    ]);
    expect(total).toBe(redondear(3 * 1000.333));
    expect(total).toBe(3001);
  });

  it("total 0 con lista vacía", () => {
    const { lineas, total } = calcularLineas([]);
    expect(lineas).toEqual([]);
    expect(total).toBe(0);
  });
});
