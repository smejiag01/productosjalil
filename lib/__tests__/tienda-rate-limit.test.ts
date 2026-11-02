jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  superaLimite,
  obtenerIp,
  LIMITE_FALLOS_POR_NIT,
  LIMITE_FALLOS_POR_IP,
} from "@/lib/tienda-rate-limit";

describe("superaLimite", () => {
  it("no bloquea por debajo de los límites", () => {
    expect(superaLimite(0, 0)).toBe(false);
    expect(superaLimite(LIMITE_FALLOS_POR_NIT - 1, LIMITE_FALLOS_POR_IP - 1)).toBe(false);
  });

  it("bloquea al llegar al límite por NIT", () => {
    expect(superaLimite(LIMITE_FALLOS_POR_NIT, 0)).toBe(true);
  });

  it("bloquea al llegar al límite por IP", () => {
    expect(superaLimite(0, LIMITE_FALLOS_POR_IP)).toBe(true);
  });
});

describe("obtenerIp", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://localhost/api", { headers });

  it("prefiere x-real-ip", () => {
    expect(obtenerIp(req({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe("1.2.3.4");
  });

  it("usa la primera IP de x-forwarded-for", () => {
    expect(obtenerIp(req({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
  });

  it("devuelve un valor fijo si no hay cabeceras", () => {
    expect(obtenerIp(req({}))).toBe("desconocida");
  });
});
