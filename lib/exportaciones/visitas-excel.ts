import * as XLSX from "xlsx";
import { horaBogota } from "@/lib/visitas";
import type { JornadaConVisitas } from "@/lib/visitas-admin";

const ANCHOS = [
  { wch: 12 }, // Fecha
  { wch: 16 }, // Ciudad
  { wch: 22 }, // Vendedor
  { wch: 10 }, // H. ingreso
  { wch: 10 }, // H. salida
  { wch: 10 }, // Hora
  { wch: 18 }, // Nicho
  { wch: 28 }, // Nombre empresa
  { wch: 30 }, // Dirección
  { wch: 14 }, // Teléfono
  { wch: 18 }, // Contacto
  { wch: 50 }, // Observaciones
  { wch: 40 }, // Ubicación
];

/**
 * Informe diario de visitas en Excel, con las mismas columnas del formato en
 * papel más la ubicación de cada visita.
 */
export function libroVisitas(jornadas: JornadaConVisitas[]): Buffer {
  const filas: Record<string, string>[] = [];
  for (const j of jornadas) {
    const base = {
      Fecha: j.fecha.toISOString().slice(0, 10),
      Ciudad: j.ciudad,
      Vendedor: j.vendedor.nombre,
      "H. ingreso": horaBogota(j.inicio_at),
      "H. salida": j.fin_at ? horaBogota(j.fin_at) : "Sin finalizar",
    };
    if (j.visitas.length === 0) {
      filas.push({ ...base, Hora: "", Nicho: "", "Nombre empresa": "(sin visitas)", Dirección: "", Teléfono: "", Contacto: "", Observaciones: "", Ubicación: "" });
      continue;
    }
    for (const v of j.visitas) {
      filas.push({
        ...base,
        Hora: horaBogota(v.registrada_at),
        Nicho: v.nicho,
        "Nombre empresa": v.nombre_empresa,
        Dirección: v.direccion ?? "",
        Teléfono: v.telefono ?? "",
        Contacto: v.contacto ?? "",
        Observaciones: v.observaciones ?? "",
        Ubicación:
          v.latitud !== null && v.longitud !== null
            ? `https://www.google.com/maps/search/?api=1&query=${v.latitud},${v.longitud}`
            : "Sin ubicación",
      });
    }
  }

  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja["!cols"] = ANCHOS;
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Visitas");
  return XLSX.write(libro, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
