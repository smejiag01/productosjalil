import { contraste } from "@/lib/design/contraste";
import { cn } from "@/lib/cn";
import {
  acento,
  estadosPedido,
  marca,
  semantica,
  superficies,
  tinta,
} from "@/lib/design/tokens";

const AA = 4.5;

describe("contraste de la paleta (WCAG AA = 4,5:1 para texto)", () => {
  const fondosClaros = [
    ["blanco", superficies.blanco],
    ["papel", superficies.papel],
    ["tinta-50", tinta[50]],
    ["tinta-100", tinta[100]],
  ] as const;

  it.each(fondosClaros)("tinta-900 sobre %s", (_n, fondo) => {
    expect(contraste(tinta[900], fondo)).toBeGreaterThanOrEqual(AA);
  });

  it.each(fondosClaros)("tinta-600 (texto secundario) sobre %s", (_n, fondo) => {
    expect(contraste(tinta[600], fondo)).toBeGreaterThanOrEqual(AA);
  });

  it.each(fondosClaros)("tinta-500 (texto mínimo) sobre %s", (_n, fondo) => {
    expect(contraste(tinta[500], fondo)).toBeGreaterThanOrEqual(AA);
  });

  it("texto de marca (pimentón) sobre blanco y papel", () => {
    expect(contraste(marca[600], superficies.blanco)).toBeGreaterThanOrEqual(AA);
    expect(contraste(marca[600], superficies.papel)).toBeGreaterThanOrEqual(AA);
  });

  it("blanco sobre el primario y sus estados hover/presionado", () => {
    for (const k of [600, 700, 800] as const) {
      expect(contraste("#FFFFFF", marca[k])).toBeGreaterThanOrEqual(AA);
    }
  });

  it("tinta-900 sobre el acento dorado", () => {
    expect(contraste(tinta[900], acento)).toBeGreaterThanOrEqual(AA);
  });

  it("blanco sobre colores semánticos sólidos", () => {
    for (const c of [semantica.ok, semantica.info, semantica.peligro]) {
      expect(contraste("#FFFFFF", c)).toBeGreaterThanOrEqual(AA);
    }
  });

  it("tinta-900 sobre advertencia sólida y textos sobre fondos suaves", () => {
    expect(contraste(tinta[900], semantica.advertencia)).toBeGreaterThanOrEqual(AA);
    expect(contraste(semantica.ok, semantica.okSuave)).toBeGreaterThanOrEqual(AA);
    expect(contraste(semantica.info, semantica.infoSuave)).toBeGreaterThanOrEqual(AA);
    expect(contraste(semantica.peligro, semantica.peligroSuave)).toBeGreaterThanOrEqual(AA);
    expect(
      contraste(semantica.advertenciaTextoSuave, semantica.advertenciaSuave)
    ).toBeGreaterThanOrEqual(AA);
  });

  it.each(Object.entries(estadosPedido))("insignia de estado %s", (_estado, par) => {
    expect(contraste(par.texto, par.fondo)).toBeGreaterThanOrEqual(AA);
  });

  it("texto claro sobre el espresso (sidebar)", () => {
    expect(contraste(tinta[100], superficies.espresso)).toBeGreaterThanOrEqual(AA);
    expect(contraste(tinta[300], superficies.espresso)).toBeGreaterThanOrEqual(AA);
    expect(contraste(tinta[100], superficies.espressoActivo)).toBeGreaterThanOrEqual(AA);
  });
});

describe("cn", () => {
  it("une clases e ignora vacíos", () => {
    expect(cn("a", false, null, undefined, "b", "")).toBe("a b");
  });
});
