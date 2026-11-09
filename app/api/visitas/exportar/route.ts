import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { hoyStr } from "@/lib/analiticas/periodos";
import { resolverRangoVisitas } from "@/lib/visitas";
import { obtenerJornadas } from "@/lib/visitas-admin";
import { libroVisitas } from "@/lib/exportaciones/visitas-excel";

/** Excel del informe de visitas en el rango y vendedor elegidos. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const sp = request.nextUrl.searchParams;
    const { desde, hasta } = resolverRangoVisitas(sp.get("desde"), sp.get("hasta"), hoyStr());
    const vendedor = sp.get("vendedor");
    const jornadas = await obtenerJornadas({
      desde,
      hasta,
      vendedorId: vendedor && z.uuid().safeParse(vendedor).success ? vendedor : null,
    });

    const buffer = libroVisitas(jornadas);
    const nombre = desde === hasta ? `visitas_${desde}.xlsx` : `visitas_${desde}_a_${hasta}.xlsx`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombre}"`,
      },
    });
  } catch (error) {
    console.error("Error al exportar visitas:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
