export type Periodo = "diario" | "semanal" | "quincenal" | "mensual";

export interface RangoStr {
  inicio: string;
  fin: string;
  inicioAnterior: string;
  finAnterior: string;
  label: string;
  navLabel: string;
}

export function hoyStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

// Para campos fecha_pedido (DATE) → UTC midnight
export function toDbDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Para campos created_at (TIMESTAMPTZ) → inicio de día Colombia en UTC
export function toUtcInicioTs(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 5, 0, 0, 0)); // Colombia = UTC-5
}

// Para campos created_at → fin de día Colombia en UTC
export function toUtcFinTs(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1, 4, 59, 59, 999));
}

export function addDias(s: string, n: number): string {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().split("T")[0];
}

function finMes(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().split("T")[0];
}

function mesAnteriorStr(s: string): string {
  const [y, m] = s.split("-").map(Number);
  const ant = new Date(Date.UTC(y, m - 2, 1));
  return `${ant.getUTCFullYear()}-${String(ant.getUTCMonth() + 1).padStart(2, "0")}`;
}

function fmtShort(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function calcularRango(periodo: Periodo, fechaRef?: string): RangoStr {
  const ref = fechaRef || hoyStr();
  const [y, m, d] = ref.split("-").map(Number);

  let inicio: string, fin: string, inicioAnt: string, finAnt: string;

  if (periodo === "diario") {
    inicio = fin = ref;
    inicioAnt = finAnt = addDias(ref, -1);
  } else if (periodo === "semanal") {
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Dom
    const diffLunes = dow === 0 ? -6 : 1 - dow;
    inicio = addDias(ref, diffLunes);
    fin = addDias(inicio, 6);
    inicioAnt = addDias(inicio, -7);
    finAnt = addDias(fin, -7);
  } else if (periodo === "quincenal") {
    const yyyyMm = ref.slice(0, 7);
    if (d <= 15) {
      inicio = `${yyyyMm}-01`;
      fin = `${yyyyMm}-15`;
      const finMesAnt = finMes(mesAnteriorStr(ref));
      const [yA, mA] = finMesAnt.split("-");
      inicioAnt = `${yA}-${mA}-16`;
      finAnt = finMesAnt;
    } else {
      inicio = `${yyyyMm}-16`;
      fin = finMes(yyyyMm);
      inicioAnt = `${yyyyMm}-01`;
      finAnt = `${yyyyMm}-15`;
    }
  } else {
    // mensual
    const yyyyMm = ref.slice(0, 7);
    inicio = `${yyyyMm}-01`;
    fin = finMes(yyyyMm);
    const antMm = mesAnteriorStr(ref);
    inicioAnt = `${antMm}-01`;
    finAnt = finMes(antMm);
  }

  const label =
    inicio === fin ? fmtShort(inicio) : `${fmtShort(inicio)} – ${fmtShort(fin)}`;

  let navLabel: string;
  if (periodo === "diario") {
    navLabel = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  } else if (periodo === "semanal") {
    navLabel = `${fmtShort(inicio)} – ${fmtShort(fin)}`;
  } else if (periodo === "quincenal") {
    const [yi, mi, di] = inicio.split("-").map(Number);
    const q = di === 1 ? "1.ª" : "2.ª";
    const mesLabel = new Date(Date.UTC(yi, mi - 1, 1)).toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    navLabel = `${q} quincena · ${mesLabel}`;
  } else {
    const [yi, mi] = inicio.split("-").map(Number);
    navLabel = new Date(Date.UTC(yi, mi - 1, 1)).toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  return { inicio, fin, inicioAnterior: inicioAnt, finAnterior: finAnt, label, navLabel };
}

export function periodoAnteriorFecha(periodo: Periodo, fechaRef: string): string {
  return calcularRango(periodo, fechaRef).inicioAnterior;
}

export function periodoSiguienteFecha(periodo: Periodo, fechaRef: string): string {
  return addDias(calcularRango(periodo, fechaRef).fin, 1);
}
