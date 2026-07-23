import * as XLSX from "xlsx";
import { ESTADOS, type EstadoPedido } from "@/lib/pedidos";
import type { PedidoExportable } from "./consultas";

export function numeroPedido(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

const ANCHOS_DETALLE = [
  { wch: 12 }, // Fecha pedido
  { wch: 10 }, // N° pedido
  { wch: 28 }, // Cliente
  { wch: 30 }, // Razón social
  { wch: 15 }, // NIT
  { wch: 18 }, // Ruta
  { wch: 28 }, // Producto
  { wch: 10 }, // Cantidad
  { wch: 15 }, // Precio unitario
  { wch: 15 }, // Subtotal
  { wch: 15 }, // Total pedido
  { wch: 14 }, // Estado
];

function filasDetalle(pedidos: PedidoExportable[]): Record<string, string | number>[] {
  const filas: Record<string, string | number>[] = [];

  for (const pedido of pedidos) {
    const fecha = pedido.fecha_pedido.toISOString().split("T")[0];
    for (const item of pedido.items) {
      filas.push({
        "Fecha pedido": fecha,
        "N° pedido": numeroPedido(pedido.id),
        Cliente: pedido.cliente.nombre,
        "Razón social": pedido.cliente.razon_social || pedido.cliente.nombre,
        NIT: pedido.cliente.nit ?? "",
        Ruta: pedido.ruta?.nombre ?? "Sin ruta",
        Producto: item.producto_nombre,
        Cantidad: Number(item.cantidad),
        "Precio unitario": Number(item.precio_unitario),
        Subtotal: Number(item.subtotal),
        "Total pedido": Number(pedido.total),
        Estado: ESTADOS[pedido.estado as EstadoPedido]?.label ?? pedido.estado,
      });
    }
  }

  if (filas.length === 0) {
    filas.push({
      "Fecha pedido": "",
      "N° pedido": "",
      Cliente: "Sin pedidos para este rango",
      "Razón social": "",
      NIT: "",
      Ruta: "",
      Producto: "",
      Cantidad: 0,
      "Precio unitario": 0,
      Subtotal: 0,
      "Total pedido": 0,
      Estado: "",
    });
  }

  return filas;
}

function hojaDetalle(pedidos: PedidoExportable[]): XLSX.WorkSheet {
  const ws = XLSX.utils.json_to_sheet(filasDetalle(pedidos));
  ws["!cols"] = ANCHOS_DETALLE;
  return ws;
}

function hojaResumen(pedidos: PedidoExportable[]): XLSX.WorkSheet {
  const porProducto = new Map<string, { cantidad: number; subtotal: number }>();
  const porCliente = new Map<string, { pedidos: number; total: number }>();

  for (const pedido of pedidos) {
    const nombreCliente = pedido.cliente.razon_social || pedido.cliente.nombre;
    const acCliente = porCliente.get(nombreCliente) ?? { pedidos: 0, total: 0 };
    acCliente.pedidos += 1;
    acCliente.total += Number(pedido.total);
    porCliente.set(nombreCliente, acCliente);

    for (const item of pedido.items) {
      const acProducto = porProducto.get(item.producto_nombre) ?? { cantidad: 0, subtotal: 0 };
      acProducto.cantidad += Number(item.cantidad);
      acProducto.subtotal += Number(item.subtotal);
      porProducto.set(item.producto_nombre, acProducto);
    }
  }

  const filasProducto = Array.from(porProducto.entries()).sort((a, b) => b[1].subtotal - a[1].subtotal);
  const filasCliente = Array.from(porCliente.entries()).sort((a, b) => b[1].total - a[1].total);

  const aoa: (string | number)[][] = [];
  aoa.push(["Resumen por producto"]);
  aoa.push(["Producto", "Cantidad total", "Subtotal total"]);
  for (const [nombre, v] of filasProducto) aoa.push([nombre, v.cantidad, v.subtotal]);
  if (filasProducto.length === 0) aoa.push(["Sin datos"]);

  aoa.push([]);
  aoa.push(["Resumen por cliente"]);
  aoa.push(["Cliente", "N° de pedidos", "Total vendido"]);
  for (const [nombre, v] of filasCliente) aoa.push([nombre, v.pedidos, v.total]);
  if (filasCliente.length === 0) aoa.push(["Sin datos"]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 16 }];
  return ws;
}

/** Libro con una sola hoja de detalle (una fila por producto de cada pedido). */
export function libroDetalle(pedidos: PedidoExportable[]): Buffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hojaDetalle(pedidos), "Detalle");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

/** Libro con hoja de detalle + hoja de resumen agregado (para informes por rango). */
export function libroInforme(pedidos: PedidoExportable[]): Buffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hojaDetalle(pedidos), "Detalle");
  XLSX.utils.book_append_sheet(wb, hojaResumen(pedidos), "Resumen");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
