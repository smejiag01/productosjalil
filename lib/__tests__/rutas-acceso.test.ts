import { esRutaRepartidor } from "@/lib/rutas-acceso";

describe("esRutaRepartidor", () => {
  it("reconoce el mini-dashboard del repartidor y sus subrutas", () => {
    expect(esRutaRepartidor("/repartidor")).toBe(true);
    expect(esRutaRepartidor("/repartidor/")).toBe(true);
    expect(esRutaRepartidor("/repartidor/pedidos")).toBe(true);
  });

  it("NO confunde el módulo admin /repartidores con el del repartidor", () => {
    expect(esRutaRepartidor("/repartidores")).toBe(false);
    expect(esRutaRepartidor("/repartidores/abc")).toBe(false);
  });

  it("rutas ajenas no coinciden", () => {
    expect(esRutaRepartidor("/")).toBe(false);
    expect(esRutaRepartidor("/pedidos")).toBe(false);
    expect(esRutaRepartidor("/tienda")).toBe(false);
  });
});
