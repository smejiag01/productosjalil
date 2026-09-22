import { precioEfectivo } from "@/lib/precios";

describe("precioEfectivo", () => {
  it("usa el precio propio del cliente cuando existe", () => {
    expect(precioEfectivo(1000, 800)).toBe(800);
  });

  it("cae al precio base cuando no hay precio propio (undefined)", () => {
    expect(precioEfectivo(1000, undefined)).toBe(1000);
  });

  it("cae al precio base cuando no hay precio propio (null)", () => {
    expect(precioEfectivo(1000, null)).toBe(1000);
  });

  it("respeta un precio propio mayor al base", () => {
    expect(precioEfectivo(1000, 1500)).toBe(1500);
  });
});
