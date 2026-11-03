export type EstadoPqr = "pendiente" | "en_revision" | "resuelto";

export const ESTADOS_PQR: Record<
  EstadoPqr,
  { label: string; color: string; bg: string; dot: string }
> = {
  pendiente: {
    label: "Pendiente",
    color: "text-warn-soft-text",
    bg: "bg-warn-soft border-warn/50",
    dot: "bg-warn",
  },
  en_revision: {
    label: "En revisión",
    color: "text-info",
    bg: "bg-info-soft border-info/30",
    dot: "bg-info",
  },
  resuelto: {
    label: "Resuelto",
    color: "text-ok",
    bg: "bg-ok-soft border-ok/30",
    dot: "bg-ok",
  },
};
