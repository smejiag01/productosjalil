export type EstadoPqr = "pendiente" | "en_revision" | "resuelto";

export const ESTADOS_PQR: Record<
  EstadoPqr,
  { label: string; color: string; bg: string; dot: string }
> = {
  pendiente: {
    label: "Pendiente",
    color: "text-yellow-800",
    bg: "bg-yellow-50 border-yellow-200",
    dot: "bg-yellow-500",
  },
  en_revision: {
    label: "En revisión",
    color: "text-blue-800",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  },
  resuelto: {
    label: "Resuelto",
    color: "text-green-800",
    bg: "bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
};
