import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { obtenerPedidosRango } from "@/lib/exportaciones/consultas";
import { libroInforme } from "@/lib/exportaciones/excel";

function fechaValida(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const desdeParam = searchParams.get("desde");
    const hastaParam = searchParams.get("hasta");

    if (!fechaValida(desdeParam) || !fechaValida(hastaParam)) {
      return NextResponse.json(
        { success: false, error: "Debes indicar un rango de fechas válido (desde y hasta)" },
        { status: 400 }
      );
    }

    const [desde, hasta] = desdeParam <= hastaParam ? [desdeParam, hastaParam] : [hastaParam, desdeParam];

    const pedidos = await obtenerPedidosRango(desde, hasta);
    const buffer = libroInforme(pedidos);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="informe-pedidos-${desde}-a-${hasta}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error al generar informe de pedidos:", error);
    return NextResponse.json(
      { success: false, error: "Error al generar el informe" },
      { status: 500 }
    );
  }
}
