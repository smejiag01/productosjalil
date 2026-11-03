import { enlaceGoogleMaps, esUrlDeGoogleMaps, parsearUbicacion } from "@/lib/ubicacion";

describe("parsearUbicacion", () => {
  it("lee coordenadas sueltas con coma, espacio o punto y coma", () => {
    expect(parsearUbicacion("4.8087, -75.6906")).toEqual({ lat: 4.8087, lng: -75.6906 });
    expect(parsearUbicacion("4.8087 -75.6906")).toEqual({ lat: 4.8087, lng: -75.6906 });
    expect(parsearUbicacion("4.8087;-75.6906")).toEqual({ lat: 4.8087, lng: -75.6906 });
  });

  it("lee el centro de la vista en un enlace largo (@lat,lng)", () => {
    const url = "https://www.google.com/maps/place/Cartago/@4.7463,-75.9116,15z/data=!4m6";
    expect(parsearUbicacion(url)).toEqual({ lat: 4.7463, lng: -75.9116 });
  });

  it("prefiere el pin exacto (!3d!4d) sobre el centro de la vista", () => {
    const url =
      "https://www.google.com/maps/place/X/@4.7000,-75.9000,17z/data=!3d4.746312!4d-75.911622";
    expect(parsearUbicacion(url)).toEqual({ lat: 4.746312, lng: -75.911622 });
  });

  it("lee parámetros q, ll y query (también con %2C)", () => {
    expect(parsearUbicacion("https://maps.google.com/?q=4.81,-75.69")).toEqual({ lat: 4.81, lng: -75.69 });
    expect(parsearUbicacion("https://maps.google.com/?ll=4.81,-75.69&z=16")).toEqual({ lat: 4.81, lng: -75.69 });
    expect(
      parsearUbicacion("https://www.google.com/maps/search/?api=1&query=4.81%2C-75.69")
    ).toEqual({ lat: 4.81, lng: -75.69 });
  });

  it("devuelve null con texto que no son coordenadas o están fuera de rango", () => {
    expect(parsearUbicacion("")).toBeNull();
    expect(parsearUbicacion("Cra 5 # 10-20, Cartago")).toBeNull();
    expect(parsearUbicacion("95.0, -75.0")).toBeNull(); // latitud fuera de rango
    expect(parsearUbicacion("4.0, -190.0")).toBeNull(); // longitud fuera de rango
    expect(parsearUbicacion("https://maps.app.goo.gl/abc123")).toBeNull(); // enlace corto: lo resuelve el servidor
  });
});

describe("enlaceGoogleMaps", () => {
  it("arma un enlace que abre el punto", () => {
    expect(enlaceGoogleMaps(4.8087, -75.6906)).toBe(
      "https://www.google.com/maps/search/?api=1&query=4.8087,-75.6906"
    );
  });
});

describe("esUrlDeGoogleMaps (protección contra SSRF)", () => {
  it("acepta enlaces de mapas de Google", () => {
    expect(esUrlDeGoogleMaps("https://maps.app.goo.gl/abc123")).toBe(true);
    expect(esUrlDeGoogleMaps("https://www.google.com/maps/place/X/@4.7,-75.9,15z")).toBe(true);
    expect(esUrlDeGoogleMaps("https://goo.gl/maps/abc")).toBe(true);
    expect(esUrlDeGoogleMaps("https://maps.google.com/?q=4.8,-75.6")).toBe(true);
  });

  it("rechaza otros sitios, http, credenciales y rutas que no son de mapas", () => {
    expect(esUrlDeGoogleMaps("https://evil.com/maps")).toBe(false);
    expect(esUrlDeGoogleMaps("http://www.google.com/maps")).toBe(false);
    expect(esUrlDeGoogleMaps("https://www.google.com/search?q=x")).toBe(false);
    expect(esUrlDeGoogleMaps("https://goo.gl/otra-cosa")).toBe(false);
    expect(esUrlDeGoogleMaps("https://user:pass@www.google.com/maps")).toBe(false);
    expect(esUrlDeGoogleMaps("https://www.google.com.evil.com/maps")).toBe(false);
    expect(esUrlDeGoogleMaps("http://169.254.169.254/")).toBe(false);
    expect(esUrlDeGoogleMaps("no es una url")).toBe(false);
  });
});
