import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { INVENTARIO_MATERIA_PRIMA_HABILITADO, respuestaInventarioDeshabilitado } from "@/lib/inventario-flags";

const esquemaDetalle = z.object({
  item_id: z.string().uuid("Ítem inválido"),
  cantidad_fisica: z.number().min(0, "La cantidad física no puede ser negativa"),
  nota: z.string().optional().nullable(),
});

const esquemaReconteo = z
  .object({
    nota_general: z.string().optional().nullable(),
    detalles: z.array(esquemaDetalle).min(1, "Debes incluir al menos un ítem en el reconteo"),
  })
  .refine(
    (d) => new Set(d.detalles.map((x) => x.item_id)).size === d.detalles.length,
    { message: "Hay ítems duplicados en el reconteo", path: ["detalles"] }
  );

class ErrorNotaRequerida extends Error {}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) return respuestaInventarioDeshabilitado();

  try {
    const { searchParams } = new URL(request.url);
    const pagina = Math.max(1, parseInt(searchParams.get("pagina") || "1"));
    const porPagina = 20;

    const [reconteos, total] = await Promise.all([
      prisma.inventario_reconteos.findMany({
        include: {
          usuario: { select: { id: true, nombre: true } },
          _count: { select: { detalles: { where: { NOT: { diferencia: 0 } } } } },
        },
        orderBy: { fecha: "desc" },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.inventario_reconteos.count(),
    ]);

    const data = reconteos.map((r) => ({
      id: r.id,
      fecha: r.fecha,
      estado: r.estado,
      nota_general: r.nota_general,
      confirmado_at: r.confirmado_at,
      usuario: r.usuario,
      total_diferencias: r._count.detalles,
    }));

    return NextResponse.json({
      success: true,
      data,
      paginacion: { pagina, total, totalPaginas: Math.ceil(total / porPagina) },
    });
  } catch (error) {
    console.error("Error al listar reconteos:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) return respuestaInventarioDeshabilitado();

  try {
    const body = await request.json();
    const resultado = esquemaReconteo.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const { nota_general, detalles } = resultado.data;
    const usuarioId = auth.session.user.id;

    const resultadoTx = await prisma.$transaction(async (tx) => {
      const reconteo = await tx.inventario_reconteos.create({
        data: {
          usuario_id: usuarioId,
          nota_general: nota_general ?? null,
          estado: "confirmado",
          confirmado_at: new Date(),
        },
      });

      let ajustados = 0;

      for (const d of detalles) {
        const item = await tx.inventario_items.findUniqueOrThrow({ where: { id: d.item_id } });
        const cantidadSistema = Number(item.stock_actual);
        const diferencia = d.cantidad_fisica - cantidadSistema;

        if (diferencia !== 0 && !(d.nota && d.nota.trim().length > 0)) {
          throw new ErrorNotaRequerida(
            `El ítem "${item.nombre}" tiene diferencia y requiere una nota antes de confirmar`
          );
        }

        const detalle = await tx.inventario_reconteo_detalles.create({
          data: {
            reconteo_id: reconteo.id,
            item_id: d.item_id,
            cantidad_sistema: cantidadSistema,
            cantidad_fisica: d.cantidad_fisica,
            nota: d.nota ?? null,
          },
        });

        if (diferencia !== 0) {
          const movimiento = await tx.inventario_movimientos.create({
            data: {
              item_id: d.item_id,
              tipo: diferencia > 0 ? "entrada" : "salida",
              motivo: "reconteo",
              cantidad: Math.abs(diferencia),
              cantidad_anterior: cantidadSistema,
              cantidad_nueva: d.cantidad_fisica,
              notas: d.nota ?? null,
              usuario_id: usuarioId,
              referencia_tipo: "reconteo",
              referencia_id: reconteo.id,
            },
          });

          await tx.inventario_items.update({
            where: { id: d.item_id },
            data: { stock_actual: d.cantidad_fisica },
          });

          await tx.inventario_reconteo_detalles.update({
            where: { id: detalle.id },
            data: { movimiento_id: movimiento.id },
          });

          ajustados += 1;
        }
      }

      return { reconteo, ajustados };
    });

    return NextResponse.json({
      success: true,
      data: { id: resultadoTx.reconteo.id, ajustados: resultadoTx.ajustados },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ErrorNotaRequerida) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Error al confirmar reconteo:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
