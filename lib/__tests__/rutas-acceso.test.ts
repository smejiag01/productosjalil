import { esRutaRepartidor, esRutaVendedor, redireccionPorRol, rutaInicioPorRol } from "@/lib/rutas-acceso";

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

describe("esRutaVendedor", () => {
  it("reconoce la app del vendedor y sus subrutas", () => {
    expect(esRutaVendedor("/vendedor")).toBe(true);
    expect(esRutaVendedor("/vendedor/visita")).toBe(true);
  });
  it("no confunde otras rutas", () => {
    expect(esRutaVendedor("/vendedores")).toBe(false);
    expect(esRutaVendedor("/")).toBe(false);
  });
});

describe("rutaInicioPorRol", () => {
  it("lleva a cada rol a su pantalla", () => {
    expect(rutaInicioPorRol("repartidor")).toBe("/repartidor");
    expect(rutaInicioPorRol("vendedor")).toBe("/vendedor");
    expect(rutaInicioPorRol("admin")).toBe("/");
    expect(rutaInicioPorRol(undefined)).toBe("/");
  });
});

describe("redireccionPorRol", () => {
  it("el vendedor solo puede estar en su app", () => {
    expect(redireccionPorRol("vendedor", "/vendedor")).toBeNull();
    expect(redireccionPorRol("vendedor", "/pedidos")).toBe("/vendedor");
    expect(redireccionPorRol("vendedor", "/repartidor")).toBe("/vendedor");
  });
  it("el repartidor solo puede estar en su app", () => {
    expect(redireccionPorRol("repartidor", "/repartidor")).toBeNull();
    expect(redireccionPorRol("repartidor", "/vendedor")).toBe("/repartidor");
  });
  it("el admin no entra a las apps de campo", () => {
    expect(redireccionPorRol("admin", "/vendedor")).toBe("/");
    expect(redireccionPorRol("admin", "/repartidor")).toBe("/");
    expect(redireccionPorRol("admin", "/clientes")).toBeNull();
  });
});
