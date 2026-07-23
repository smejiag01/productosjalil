import PDFDocument from "pdfkit";
import { formatearPrecio } from "@/lib/formato";
import type { PedidoExportable } from "./consultas";

const MARGEN = 40;
const ANCHO_PAGINA_A4 = 595.28;
const ANCHO_UTIL = ANCHO_PAGINA_A4 - MARGEN * 2;

function agruparPorRuta(pedidos: PedidoExportable[]) {
  const grupos = new Map<string, { nombre: string; pedidos: PedidoExportable[] }>();
  for (const pedido of pedidos) {
    const clave = pedido.ruta_id ?? "sin-ruta";
    if (!grupos.has(clave)) {
      grupos.set(clave, { nombre: pedido.ruta?.nombre ?? "Sin ruta asignada", pedidos: [] });
    }
    grupos.get(clave)!.pedidos.push(pedido);
  }
  return Array.from(grupos.values());
}

/** PDF simple para que quien despacha la ruta lo imprima o revise en camino. */
export function generarPdfDespacho(fecha: string, pedidos: PedidoExportable[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGEN });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").fillColor("#8B1A1A").text("Despacho de pedidos");
    doc.fillColor("#000000").fontSize(10).font("Helvetica").text(`Productos Jalil — ${fecha}`);
    doc.moveDown(1);

    const rutas = agruparPorRuta(pedidos);
    let totalGeneral = 0;

    if (rutas.length === 0) {
      doc.fontSize(11).font("Helvetica").text("No hay pedidos para despachar en esta fecha.");
    }

    for (const { nombre, pedidos: pedidosRuta } of rutas) {
      if (doc.y > 700) doc.addPage();

      doc.fontSize(13).font("Helvetica-Bold").fillColor("#8B1A1A").text(nombre);
      doc.fillColor("#000000");
      doc
        .moveTo(MARGEN, doc.y + 2)
        .lineTo(MARGEN + ANCHO_UTIL, doc.y + 2)
        .strokeColor("#8B1A1A")
        .stroke();
      doc.moveDown(0.6);

      let subtotalRuta = 0;

      for (const pedido of pedidosRuta) {
        if (doc.y > 720) doc.addPage();

        doc.fontSize(11).font("Helvetica-Bold").fillColor("#000000").text(pedido.cliente.nombre);
        doc.fontSize(9).font("Helvetica");
        for (const item of pedido.items) {
          doc.text(`   ${Number(item.cantidad)} × ${item.producto_nombre}`);
        }
        doc.fontSize(10).font("Helvetica-Bold").text(`Total pedido: ${formatearPrecio(Number(pedido.total))}`, {
          align: "right",
        });
        doc.font("Helvetica").moveDown(0.5);

        subtotalRuta += Number(pedido.total);
      }

      doc.fontSize(10).font("Helvetica-Bold").text(`Subtotal ${nombre}: ${formatearPrecio(subtotalRuta)}`, {
        align: "right",
      });
      doc.moveDown(1);

      totalGeneral += subtotalRuta;
    }

    if (rutas.length > 0) {
      doc
        .moveTo(MARGEN, doc.y)
        .lineTo(MARGEN + ANCHO_UTIL, doc.y)
        .strokeColor("#000000")
        .stroke();
      doc.moveDown(0.4);
      doc.fontSize(14).font("Helvetica-Bold").text(`TOTAL GENERAL: ${formatearPrecio(totalGeneral)}`, {
        align: "right",
      });
    }

    doc.end();
  });
}
