import { NextResponse } from "next/server";
import { requireVendedor } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * Estado del vendedor al abrir la app: su jornada abierta (si tiene) con las
 * visitas ya guardadas en el servidor, y la última ciudad para sugerirla.
 */
export async function GET() {
  const auth = await requireVendedor();
  if (auth.error) return auth.error;
  const vendedorId = auth.session.user.id;

  try {
    const [abierta, ultima] = await Promise.all([
      prisma.jornadas_visita.findFirst({
        where: { vendedor_id: vendedorId, fin_at: null },
        orderBy: { inicio_at: "desc" },
        include: { visitas: { orderBy: { registrada_at: "desc" } } },
      }),
      prisma.jornadas_visita.findFirst({
        where: { vendedor_id: vendedorId },
        orderBy: { inicio_at: "desc" },
        select: { ciudad: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ultimaCiudad: ultima?.ciudad ?? null,
        jornada: abierta
          ? {
              id: abierta.id,
              ciudad: abierta.ciudad,
              inicio_at: abierta.inicio_at.toISOString(),
              visitas: abierta.visitas.map((v) => ({
                id: v.id,
                registrada_at: v.registrada_at.toISOString(),
                nicho: v.nicho,
                nombre_empresa: v.nombre_empresa,
                direccion: v.direccion,
                telefono: v.telefono,
                contacto: v.contacto,
                observaciones: v.observaciones,
                tieneUbicacion: v.latitud !== null && v.longitud !== null,
              })),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error al leer el estado del vendedor:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
