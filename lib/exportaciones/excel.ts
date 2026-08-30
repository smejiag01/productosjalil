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

/** Excel no permite : \ / ? * [ ] en el nombre de hoja, ni más de 31 caracteres. */
function nombreHojaValido(nombre: string, usados: Set<string>): string {
  const limpio = nombre.replace(/[:\\/?*[\]]/g, "").trim().slice(0, 31) || "Ruta";
  let final = limpio;
  let i = 2;
  while (usados.has(final.toLowerCase())) {
    final = `${limpio.slice(0, 28)} ${i}`;
    i++;
  }
  usados.add(final.toLowerCase());
  return final;
}

/**
 * Libro con una hoja por ruta (formato matriz: una fila por cliente, una
 * columna por producto pedido ese día) — reemplaza la planilla que armaban
 * a mano para saber qué preparar por ruta.
 */
export function libroMatrizPorRuta(pedidos: PedidoExportable[], fecha: string): Buffer {
  const wb = XLSX.utils.book_new();
  const nombresUsados = new Set<string>();

  const porRuta = new Map<string, { nombre: string; pedidos: PedidoExportable[] }>();
  for (const pedido of pedidos) {
    const clave = pedido.ruta_id ?? "sin-ruta";
    if (!porRuta.has(clave)) {
      porRuta.set(clave, { nombre: pedido.ruta?.nombre ?? "Sin ruta asignada", pedidos: [] });
    }
    porRuta.get(clave)!.pedidos.push(pedido);
  }

  for (const { nombre, pedidos: pedidosRuta } of Array.from(porRuta.values())) {
    const productos = Array.from(
      new Set(pedidosRuta.flatMap((p) => p.items.map((it) => it.producto_nombre)))
    ).sort((a, b) => a.localeCompare(b, "es"));

    const aoa: (string | number)[][] = [];
    aoa.push([nombre]);
    aoa.push([fecha]);
    aoa.push(["#", "Cliente", ...productos]);

    pedidosRuta.forEach((pedido, i) => {
      const cantidadPorProducto = new Map<string, number>();
      for (const item of pedido.items) {
        cantidadPorProducto.set(
          item.producto_nombre,
          (cantidadPorProducto.get(item.producto_nombre) ?? 0) + Number(item.cantidad)
        );
      }
      aoa.push([
        i + 1,
        pedido.cliente.nombre,
        ...productos.map((prod) => cantidadPorProducto.get(prod) ?? ""),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 4 }, { wch: 30 }, ...productos.map(() => ({ wch: 14 }))];
    XLSX.utils.book_append_sheet(wb, ws, nombreHojaValido(nombre, nombresUsados));
  }

  if (porRuta.size === 0) {
    const ws = XLSX.utils.aoa_to_sheet([["Sin pedidos para esta fecha"]]);
    XLSX.utils.book_append_sheet(wb, ws, "Sin datos");
  }

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

/** Una fila por pedido con el detalle de productos resumido en texto. */
export function libroResumenPorCliente(pedidos: PedidoExportable[]): Buffer {
  const ordenados = [...pedidos].sort((a, b) => a.cliente.nombre.localeCompare(b.cliente.nombre, "es"));

  const filas = ordenados.map((pedido) => ({
    "N° pedido": numeroPedido(pedido.id),
    Cliente: pedido.cliente.nombre,
    "Razón social": pedido.cliente.razon_social || pedido.cliente.nombre,
    Ruta: pedido.ruta?.nombre ?? "Sin ruta",
    "Detalle del pedido": pedido.items
      .map((item) => `${Number(item.cantidad)} x ${item.producto_nombre}`)
      .join(", "),
    "N° productos": pedido.items.length,
    Total: Number(pedido.total),
    Estado: ESTADOS[pedido.estado as EstadoPedido]?.label ?? pedido.estado,
  }));

  if (filas.length === 0) {
    filas.push({
      "N° pedido": "",
      Cliente: "Sin pedidos para esta fecha",
      "Razón social": "",
      Ruta: "",
      "Detalle del pedido": "",
      "N° productos": 0,
      Total: 0,
      Estado: "",
    });
  }

  const ws = XLSX.utils.json_to_sheet(filas);
  ws["!cols"] = [
    { wch: 10 }, // N° pedido
    { wch: 28 }, // Cliente
    { wch: 30 }, // Razón social
    { wch: 18 }, // Ruta
    { wch: 60 }, // Detalle del pedido
    { wch: 12 }, // N° productos
    { wch: 14 }, // Total
    { wch: 14 }, // Estado
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pedidos por cliente");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

/** Libro con hoja de detalle + hoja de resumen agregado (para informes por rango). */
export function libroInforme(pedidos: PedidoExportable[]): Buffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hojaDetalle(pedidos), "Detalle");
  XLSX.utils.book_append_sheet(wb, hojaResumen(pedidos), "Resumen");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
