import {
  normalizarNit,
  soloDigitos,
  normalizarWhatsapp,
  esquemaLoginTienda,
  esquemaCrearPedido,
  esquemaCarrito,
} from "@/lib/validaciones-tienda";

describe("normalizarNit", () => {
  it("quita el dígito de verificación después del guion", () => {
    expect(normalizarNit("901234567-8")).toBe("901234567");
  });

  it("quita puntos de miles", () => {
    expect(normalizarNit("901.234.567")).toBe("901234567");
  });

  it("quita espacios", () => {
    expect(normalizarNit("  901 234 567 ")).toBe("901234567");
  });

  it("combina puntos + guion con dígito de verificación", () => {
    expect(normalizarNit("901.234.567-8")).toBe("901234567");
  });

  it("deja intacto un documento ya limpio", () => {
    expect(normalizarNit("1025461205")).toBe("1025461205");
  });

  it("maneja un guion al final sin dígito", () => {
    expect(normalizarNit("900123456-")).toBe("900123456");
  });
});

describe("soloDigitos", () => {
  it("deja solo dígitos", () => {
    expect(soloDigitos("+57 (312) 722-1364")).toBe("573127221364");
  });
});

describe("normalizarWhatsapp", () => {
  it("agrega el prefijo 57 a un celular de 10 dígitos", () => {
    expect(normalizarWhatsapp("316 333 2739")).toBe("573163332739");
    expect(normalizarWhatsapp("3163332739")).toBe("573163332739");
  });

  it("acepta el número con prefijo de país", () => {
    expect(normalizarWhatsapp("+57 316 333 2739")).toBe("573163332739");
  });

  it("rechaza números que no son celulares colombianos", () => {
    expect(normalizarWhatsapp("6063332739")).toBeNull(); // fijo
    expect(normalizarWhatsapp("316333")).toBeNull(); // corto
    expect(normalizarWhatsapp("abc")).toBeNull();
    expect(normalizarWhatsapp("")).toBeNull();
  });

  it("la salida es siempre solo dígitos (segura para el enlace de wa.me)", () => {
    const salida = normalizarWhatsapp('3163332739"><script>');
    expect(salida).toBe("573163332739");
    expect(salida).toMatch(/^\d+$/);
    // y si lo que queda no es un celular válido, se rechaza
    expect(normalizarWhatsapp('"><script>alert(1)</script>')).toBeNull();
  });
});

describe("esquemaLoginTienda", () => {
  it("normaliza el nit al parsear", () => {
    const r = esquemaLoginTienda.safeParse({ nit: "901.234.567-8" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.nit).toBe("901234567");
  });

  it("rechaza un nit vacío", () => {
    expect(esquemaLoginTienda.safeParse({ nit: "   " }).success).toBe(false);
    expect(esquemaLoginTienda.safeParse({}).success).toBe(false);
  });
});

describe("límites del carrito y del pedido", () => {
  const id = "1dca35f4-780e-4d6a-a66d-f9f2e6246a2a";

  it("rechaza cantidades absurdas", () => {
    expect(esquemaCarrito.safeParse({ items: [{ producto_id: id, cantidad: 1_000_000 }] }).success).toBe(false);
  });

  it("rechaza más de 100 productos distintos", () => {
    const items = Array.from({ length: 101 }, () => ({ producto_id: id, cantidad: 1 }));
    expect(esquemaCarrito.safeParse({ items }).success).toBe(false);
  });

  it("rechaza un pedido sin productos", () => {
    expect(esquemaCrearPedido.safeParse({ fecha_entrega: "2026-11-10", items: [] }).success).toBe(false);
  });

  it("acepta un pedido normal", () => {
    const r = esquemaCrearPedido.safeParse({
      fecha_entrega: "2026-11-10",
      sede_id: null,
      items: [{ producto_id: id, cantidad: 2 }],
    });
    expect(r.success).toBe(true);
  });
});
