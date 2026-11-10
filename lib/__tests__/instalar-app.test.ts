import { avisoDescartadoVigente, debeMostrarAviso, detectarPlataforma, DIAS_SIN_AVISO } from "@/lib/instalar-app";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36";
const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";

describe("detectarPlataforma", () => {
  it("reconoce iPhone, iPad (que se presenta como Mac táctil) y Android", () => {
    expect(detectarPlataforma(IPHONE, 5)).toBe("ios");
    expect(detectarPlataforma(IPAD, 5)).toBe("ios");
    expect(detectarPlataforma(IPAD, 0)).toBe("otra"); // un Mac de verdad
    expect(detectarPlataforma(ANDROID, 5)).toBe("android");
    expect(detectarPlataforma(WINDOWS, 0)).toBe("otra");
  });
});

describe("avisoDescartadoVigente", () => {
  const ahora = Date.UTC(2026, 10, 10);
  it("dura los días configurados", () => {
    expect(avisoDescartadoVigente(null, ahora)).toBe(false);
    expect(avisoDescartadoVigente(ahora - 86_400_000, ahora)).toBe(true);
    expect(avisoDescartadoVigente(ahora - (DIAS_SIN_AVISO + 1) * 86_400_000, ahora)).toBe(false);
  });
});

describe("debeMostrarAviso", () => {
  const base = { plataforma: "android" as const, esTactil: true, instalada: false, dentroDeApk: false, descartadoEn: null, ahora: 1 };
  it("se muestra en celular o tablet sin la app", () => {
    expect(debeMostrarAviso(base)).toBe(true);
    expect(debeMostrarAviso({ ...base, plataforma: "ios" })).toBe(true);
  });
  it("no se muestra en computador, con la app instalada, dentro de la APK o si se descartó", () => {
    expect(debeMostrarAviso({ ...base, plataforma: "otra" })).toBe(false);
    expect(debeMostrarAviso({ ...base, esTactil: false })).toBe(false);
    expect(debeMostrarAviso({ ...base, instalada: true })).toBe(false);
    expect(debeMostrarAviso({ ...base, dentroDeApk: true })).toBe(false);
    expect(debeMostrarAviso({ ...base, descartadoEn: 0.5, ahora: 1 })).toBe(false);
  });
});
