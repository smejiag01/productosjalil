import { calcularRango, toDbDate } from "@/lib/analiticas/periodos";
import { estadosPedido } from "@/lib/design/tokens";
import type { Periodo } from "@/lib/analiticas/periodos";

/** Datos del periodo elegido que comparten todas las pestañas de Analíticas. */
export interface ContextoAnalitica {
  rango: ReturnType<typeof calcularRango>;
  periodo: Periodo;
  esPersonalizado: boolean;
  inicioDb: Date;
  finDb: Date;
  inicioAntDb: Date;
  finAntDb: Date;
  inicioTs: Date;
  finTs: Date;
}

export const TABS = [
  { key: "ventas",     label: "Ventas" },
  { key: "pedidos",    label: "Pedidos" },
  { key: "productos",  label: "Productos" },
  { key: "clientes",   label: "Clientes" },
  { key: "inventario", label: "Inventario" },
  { key: "rutas",      label: "Rutas" },
];

export const ESTADOS_COLORES: Record<string, string> = Object.fromEntries(
  Object.entries(estadosPedido).map(([estado, c]) => [estado, c.fondo])
);

export const ESTADOS_LABELS: Record<string, string> = {
  pendiente:  "Pendiente",
  en_proceso: "En proceso",
  confirmado: "Confirmado",
  en_reparto: "En reparto",
  cancelado:  "Cancelado",
  entregado:  "Entregado",
  devuelto:   "Devuelto",
};

export const TIPOS_INV_LABEL: Record<string, string> = {
  insumo: "Insumos",
  materia_prima: "Materias primas",
  producto_terminado: "Prod. terminado",
};

export const DIAS_INACTIVIDAD = 14;

export type FilaVentas   = { fecha: Date; total: number };
export type FilaEstado   = { fecha: Date; estado: string; count: number };
export type FilaProducto = { nombre: string; cantidad: number; ingresos: number };
export type FilaCliente  = { nombre: string; pedidos: number; total: number };
export type FilaInactivo = { nombre: string; dias: number | null };
export type FilaConsumo  = { tipo: string; cantidad: number };
export type FilaMerma    = { nombre: string; cantidad: number; costo_total: number };
export type FilaRotacion = { nombre: string; movimientos: number };
export type FilaProduccion = { nombre: string; cantidad: number };
export type FilaClientePrecio = { con_precio: number; sin_precio: number };
export type FilaVentasRuta = { ruta: string; pedidos: number; total: number };
export type FilaDevolucionRuta = { ruta: string; devueltos: number; total: number };
export type FilaTiempoRuta = { ruta: string; horas_promedio: number | null };
export type FilaRepartidor = { repartidor: string; entregados: number; devueltos: number };
export type FilaTiempo = { horas_promedio: number | null };
export type FilaHoraPico = { hora: number; total: number };
export type FilaBucket = { bucket: string; total: number };
export type FilaFrecuencia = { frecuencia_promedio: number | null };
export type FilaRetencion = { anterior_total: number; retenidos: number };
export type FilaMultiSede = { multi_sede: number };
export type FilaAlertaDias = { id: string; nombre: string; dias_sin_entrada: number | null };

export const ORDEN_BUCKETS = ["<1h", "1-3h", "3-6h", "+6h"];
export const LABELS_BUCKETS: Record<string, string> = {
  "<1h": "Menos de 1h",
  "1-3h": "1 a 3h",
  "3-6h": "3 a 6h",
  "+6h": "Más de 6h",
};

export function diffDias(a: string, b: string): number {
  return (toDbDate(b).getTime() - toDbDate(a).getTime()) / 86400000;
}
