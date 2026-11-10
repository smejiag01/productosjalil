/**
 * Horario de los mensajes automáticos de WhatsApp (recordatorio y
 * seguimiento). Los flujos de n8n (Recordatorio y Seguimiento) revisan cada
 * 15 minutos todo el día y envían solo en la ventana de 15 minutos de la hora
 * guardada en `configuracion` (hora de Bogotá). La franja permitida evita
 * escribirles a los clientes de madrugada o de noche.
 */
export const HORA_MINIMA = "06:00";
export const HORA_MAXIMA = "20:45";
export const HORAS_ESPERA_MAX = 12;

const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const aHora = (minutos: number) =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

/** "14:30" → "2:30 p. m." */
export function horaLegible(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const sufijo = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

export type ResultadoHorario =
  | { ok: true; horaRecordatorio: string; horaSeguimiento: string }
  | { ok: false; error: string };

/** Valida la hora del recordatorio (HH:MM) y las horas de espera del seguimiento. */
export function validarHorarioMensajes(hora: string, horasEspera: number): ResultadoHorario {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    return { ok: false, error: "La hora del recordatorio no es válida" };
  }
  if (!Number.isInteger(horasEspera) || horasEspera < 1 || horasEspera > HORAS_ESPERA_MAX) {
    return { ok: false, error: `Las horas de espera deben ser un número entero entre 1 y ${HORAS_ESPERA_MAX}` };
  }
  const inicio = aMinutos(hora);
  if (inicio < aMinutos(HORA_MINIMA) || inicio > aMinutos(HORA_MAXIMA)) {
    return {
      ok: false,
      error: `El recordatorio debe salir entre las ${horaLegible(HORA_MINIMA)} y las ${horaLegible(HORA_MAXIMA)}`,
    };
  }
  const seguimiento = inicio + horasEspera * 60;
  if (seguimiento > aMinutos(HORA_MAXIMA)) {
    return {
      ok: false,
      error: `El seguimiento caería a las ${horaLegible(aHora(seguimiento % 1440))}; debe salir a más tardar a las ${horaLegible(HORA_MAXIMA)}. Adelanta el recordatorio o reduce las horas de espera.`,
    };
  }
  return { ok: true, horaRecordatorio: hora, horaSeguimiento: aHora(seguimiento) };
}
