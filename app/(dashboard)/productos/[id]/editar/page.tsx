import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FormularioProducto from "../../FormularioProducto";

import { ChevronLeft } from "@/components/ui/icons";
export const dynamic = "force-dynamic";

export default async function EditarProductoPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const [producto, categorias] = await Promise.all([
    prisma.productos.findUnique({ where: { id: params.id } }),
    prisma.categorias.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
      select: { id: true, nombre: true, emoji: true },
    }),
  ]);

  if (!producto) notFound();

  return (
    <div>
      <Link
        href="/productos"
        className="text-sm text-ink-500 hover:text-ink-700 transition-colors flex items-center gap-1 mb-3"
      >
        <ChevronLeft aria-hidden="true" className="w-4 h-4" />
        Productos
      </Link>

      <h1 className="text-2xl font-bold text-ink-900 mb-6">
        Editar producto
      </h1>

      <div className="bg-white rounded-card border border-ink-200 shadow-card p-6">
        <FormularioProducto
          productoInicial={{
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            unidad: producto.unidad,
            precio_base: Number(producto.precio_base),
            activo: producto.activo,
            orden: producto.orden,
            imagen_url: producto.imagen_url,
            categoria_id: producto.categoria_id,
          }}
          categorias={categorias}
        />
      </div>
    </div>
  );
}
