import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FormularioProducto from "../../FormularioProducto";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
}: {
  params: { id: string };
}) {
  const producto = await prisma.productos.findUnique({
    where: { id: params.id },
  });

  if (!producto) notFound();

  return (
    <div>
      <Link
        href="/productos"
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mb-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Productos
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Editar producto
      </h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
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
          }}
        />
      </div>
    </div>
  );
}
