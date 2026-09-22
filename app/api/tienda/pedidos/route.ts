import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClienteSession } from "@/lib/tienda-auth";
import { esquemaCrearPedido } from "@/lib/validaciones-tienda";
import { COOKIE_CARRITO, opcionesCookieCarrito } from "@/lib/tienda-session";
import { proximasFechasEntrega } from "@/lib/fechas-entrega";
import { precioEfectivo, resolverPreciosCliente } from "@/lib/precios";
import { calcularLineas, type LineaPrecio } from "@/lib/pedido-calculo";
import { toDbDate } from "@/lib/analiticas/periodos";

export async function POST(request: NextRequest) {
  const auth = await requireClienteSession();
  if (auth.error) return auth.error;
  const clienteId = auth.clienteId;

  try {
    const body = await request.json();
    const resultado = esquemaCrearPedido.safeParse(body);
    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({
        campo: i.path.join("."),
        mensaje: i.message,
      }));
      return NextResponse.json(
        { success: false, error: "Datos inválidos", errores },
        { status: 400 }
      );
    }

    const { fecha_entrega, sede_id, items } = resultado.data;

    const cliente = await prisma.clientes.findFirst({
      where: { id: clienteId, activo: true },
      include: { ruta: true },
    });
    if (!cliente) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    // (b) Cliente CON ruta. Nunca calculamos fechas sin ruta.
    if (!cliente.ruta_id || !cliente.ruta) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tu cuenta no tiene una ruta de entrega asignada, comunícate con nosotros.",
        },
        { status: 409 }
      );
    }

    // (c) fecha_entrega válida: debe estar entre las fechas disponibles reales.
    const fechasDisponibles = proximasFechasEntrega({
      dias_semana: cliente.ruta.dias_semana,
      frecuencia: cliente.ruta.frecuencia,
      fecha_base: cliente.ruta.fecha_base,
    });
    if (!fechasDisponibles.includes(fecha_entrega)) {
      return NextResponse.json(
        {
          success: false,
          error: "La fecha de entrega seleccionada ya no está disponible. Elige otra.",
        },
        { status: 400 }
      );
    }

    // (d) sede_id: si viene, debe ser del cliente y estar activa.
    const sedesActivas = await prisma.sedes.findMany({
      where: { cliente_id: clienteId, activa: true },
    });
    let sedeIdFinal: string | null = null;
    if (sede_id) {
      const sede = sedesActivas.find((s) => s.id === sede_id);
      if (!sede) {
        return NextResponse.json(
          { success: false, error: "La sede de entrega seleccionada no es válida." },
          { status: 400 }
        );
      }
      sedeIdFinal = sede.id;
    } else if (sedesActivas.length > 1) {
      return NextResponse.json(
        { success: false, error: "Debes elegir una sede de entrega." },
        { status: 400 }
      );
    } else if (sedesActivas.length === 1) {
      sedeIdFinal = sedesActivas[0].id;
    } else {
      sedeIdFinal = null; // sin sedes → se entrega a cliente.direccion
    }

    // (e) Cada producto debe existir y seguir activo.
    const productoIds = Array.from(new Set(items.map((i) => i.producto_id)));
    const productos = await prisma.productos.findMany({
      where: { id: { in: productoIds } },
    });
    const productosMap = new Map(productos.map((p) => [p.id, p]));
    for (const it of items) {
      const p = productosMap.get(it.producto_id);
      if (!p || !p.activo) {
        return NextResponse.json(
          {
            success: false,
            error: `El producto "${p?.nombre ?? "seleccionado"}" ya no está disponible.`,
          },
          { status: 400 }
        );
      }
    }

    // Precios SIEMPRE recalculados en el servidor.
    const preciosMap = await resolverPreciosCliente(clienteId, productoIds);
    const lineas: LineaPrecio[] = items.map((it) => {
      const p = productosMap.get(it.producto_id)!;
      return {
        producto_id: p.id,
        producto_nombre: p.nombre,
        cantidad: it.cantidad,
        precio_unitario: precioEfectivo(Number(p.precio_base), preciosMap.get(p.id)),
      };
    });
    const { lineas: lineasCalc, total } = calcularLineas(lineas);

    const pedido = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.pedidos.create({
        data: {
          cliente_id: clienteId,
          ruta_id: cliente.ruta_id,
          sede_id: sedeIdFinal,
          estado: "pendiente",
          total,
          fecha_pedido: toDbDate(fecha_entrega),
        },
      });
      await tx.pedido_items.createMany({
        data: lineasCalc.map((l) => ({ ...l, pedido_id: nuevo.id })),
      });
      return nuevo;
    });

    const sedeElegida = sedeIdFinal
      ? sedesActivas.find((s) => s.id === sedeIdFinal)
      : null;

    const respuesta = NextResponse.json({
      success: true,
      data: {
        pedido_id: pedido.id,
        numero: pedido.id.slice(0, 8).toUpperCase(),
        fecha_entrega,
        total,
        items: lineasCalc,
        entrega: sedeElegida
          ? {
              tipo: "sede" as const,
              nombre: sedeElegida.nombre_sede,
              direccion: sedeElegida.direccion,
            }
          : {
              tipo: "direccion" as const,
              nombre: null,
              direccion: cliente.direccion,
            },
      },
    });
    // El pedido quedó creado: se limpia el carrito.
    respuesta.cookies.set(COOKIE_CARRITO, "", opcionesCookieCarrito(0));
    return respuesta;
  } catch (error) {
    console.error("Error al crear pedido de tienda:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
