import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { obtenerPedidosRango } from "@/lib/exportaciones/consultas";
import { libroResumenPorCliente } from "@/lib/exportaciones/excel";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const fechaParam = searchParams.get("fecha");
    let fecha = fechaParam;
    if (!fecha) {
      const bogota = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
      fecha = `${bogota.getFullYear()}-${String(bogota.getMonth() + 1).padStart(2, "0")}-${String(bogota.getDate()).padStart(2, "0")}`;
    }

    const pedidos = await obtenerPedidosRango(fecha, fecha, { excluirCancelados: true });
    const buffer = libroResumenPorCliente(pedidos);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="pedidos-por-cliente-${fecha}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error al exportar pedidos por cliente:", error);
    return NextResponse.json(
      { success: false, error: "Error al generar el archivo Excel" },
      { status: 500 }
    );
  }
}
