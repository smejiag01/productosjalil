import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { INVENTARIO_MATERIA_PRIMA_HABILITADO, respuestaInventarioDeshabilitado } from "@/lib/inventario-flags";

const esquemaProduccion = z.object({
  item_id: z.string().uuid("Producto terminado inválido"),
  cantidad: z.number().positive("La cantidad a producir debe ser mayor a 0"),
  notas: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!INVENTARIO_MATERIA_PRIMA_HABILITADO) return respuestaInventarioDeshabilitado();

  try {
    const body = await request.json();
    const resultado = esquemaProduccion.safeParse(body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
      return NextResponse.json({ success: false, error: "Datos inválidos", errores }, { status: 400 });
    }

    const { item_id, cantidad, notas } = resultado.data;
    const usuarioId = auth.session.user.id;

    const productoTerminado = await prisma.inventario_items.findUnique({ where: { id: item_id } });
    if (!productoTerminado || productoTerminado.tipo !== "producto_terminado") {
      return NextResponse.json({ success: false, error: "Producto terminado no encontrado" }, { status: 404 });
    }

    const receta = await prisma.inventario_recetas.findMany({
      where: { producto_terminado_id: item_id, activo: true },
      include: { insumo: true },
    });

    const resultadoTx = await prisma.$transaction(async (tx) => {
      // Producto terminado: recalcular desde BD dentro de la transacción
      const ptActual = await tx.inventario_items.findUniqueOrThrow({ where: { id: item_id } });
      const stockAnteriorPt = Number(ptActual.stock_actual);
      const stockNuevoPt = stockAnteriorPt + cantidad;

      await tx.inventario_items.update({
        where: { id: item_id },
        data: { stock_actual: stockNuevoPt },
      });

      const movimientoProduccionId = randomUUID();
      const movimientoProduccion = await tx.inventario_movimientos.create({
        data: {
          id: movimientoProduccionId,
          item_id,
          tipo: "entrada",
          motivo: "produccion",
          cantidad,
          cantidad_anterior: stockAnteriorPt,
          cantidad_nueva: stockNuevoPt,
          notas: notas ?? null,
          usuario_id: usuarioId,
        },
      });

      const negativos: { id: string; nombre: string; unidad: string; stock_resultante: number }[] = [];
      const movimientosInsumos = [];

      for (const linea of receta) {
        const insumoActual = await tx.inventario_items.findUniqueOrThrow({ where: { id: linea.insumo_id } });
        const cantidadConsumida = Number(linea.cantidad_requerida) * cantidad;
        const stockAnteriorInsumo = Number(insumoActual.stock_actual);
        const stockNuevoInsumo = stockAnteriorInsumo - cantidadConsumida;

        await tx.inventario_items.update({
          where: { id: linea.insumo_id },
          data: { stock_actual: stockNuevoInsumo },
        });

        const movInsumo = await tx.inventario_movimientos.create({
          data: {
            item_id: linea.insumo_id,
            tipo: "salida",
            motivo: "produccion",
            cantidad: cantidadConsumida,
            cantidad_anterior: stockAnteriorInsumo,
            cantidad_nueva: stockNuevoInsumo,
            notas: notas ?? null,
            usuario_id: usuarioId,
            referencia_tipo: "produccion",
            referencia_id: movimientoProduccionId,
          },
        });
        movimientosInsumos.push(movInsumo);

        if (stockNuevoInsumo < 0) {
          negativos.push({
            id: insumoActual.id,
            nombre: insumoActual.nombre,
            unidad: insumoActual.unidad,
            stock_resultante: stockNuevoInsumo,
          });
        }
      }

      return { movimientoProduccion, movimientosInsumos, negativos };
    });

    return NextResponse.json({
      success: true,
      data: {
        movimiento: resultadoTx.movimientoProduccion,
        insumosConsumidos: resultadoTx.movimientosInsumos.length,
        negativos: resultadoTx.negativos,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error al registrar producción:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
