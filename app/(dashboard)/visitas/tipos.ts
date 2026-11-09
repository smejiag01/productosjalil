/** Datos ya serializados que la página de servidor le pasa al panel. */
export interface VisitaPanel {
  id: string;
  hora: string;
  nicho: string;
  nombreEmpresa: string;
  direccion: string | null;
  telefono: string | null;
  contacto: string | null;
  observaciones: string | null;
  latitud: number | null;
  longitud: number | null;
  clienteId: string | null;
  clienteNombre: string | null;
  enPorContactar: boolean;
  /** Notas sugeridas para el cliente nuevo o para "Por contactar". */
  notas: string;
  vendedor: string;
  colorVendedor: string;
}

export interface JornadaPanel {
  id: string;
  fechaLabel: string;
  ciudad: string;
  vendedor: string;
  colorVendedor: string;
  horaInicio: string;
  horaFin: string | null;
  visitas: VisitaPanel[];
}

export interface Opcion {
  id: string;
  nombre: string;
}
