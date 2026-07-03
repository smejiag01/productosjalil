import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SeccionReceta from "./SeccionReceta";

export const dynamic = "force-dynamic";

export default async function DetalleProductoTerminadoPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await prisma.inventario_items.findUnique({
    where: { id: params.id },
    include: { producto: { select: { id: true, nombre: true } } },
  });

  if (!item || item.tipo !== "producto_terminado") {
    notFound();
  }

  const [receta, disponibles] = await Promise.all([
    prisma.inventario_recetas.findMany({
      where: { producto_terminado_id: item.id, activo: true },
      include: {
        insumo: { select: { id: true, nombre: true, unidad: true, tipo: true, stock_actual: true } },
      },
      orderBy: { created_at: "asc" },
    }),
    prisma.inventario_items.findMany({
      where: { tipo: { in: ["insumo", "materia_prima"] }, activo: true },
      select: { id: true, nombre: true, unidad: true, tipo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const recetaSerializada = receta.map((r) => ({
    id: r.id,
    cantidad_requerida: Number(r.cantidad_requerida),
    insumo: {
      id: r.insumo.id,
      nombre: r.insumo.nombre,
      unidad: r.insumo.unidad,
      tipo: r.insumo.tipo,
      stock_actual: Number(r.insumo.stock_actual),
    },
  }));

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/inventarios/producto-terminado"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mb-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Producto terminado
        </Link>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{item.nombre}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Stock actual: {Number(item.stock_actual)} {item.unidad}
          {item.producto ? ` · Vinculado a: ${item.producto.nombre}` : ""}
        </p>
      </div>

      <SeccionReceta
        productoTerminadoId={item.id}
        recetaInicial={recetaSerializada}
        disponibles={disponibles}
      />
    </div>
  );
}
