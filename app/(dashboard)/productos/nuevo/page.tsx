import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FormularioProducto from "../FormularioProducto";

import { ChevronLeft } from "@/components/ui/icons";
export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const categorias = await prisma.categorias.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true, emoji: true },
  });

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
        Nuevo producto
      </h1>

      <div className="bg-white rounded-card border border-ink-200 shadow-card p-6">
        <FormularioProducto categorias={categorias} />
      </div>
    </div>
  );
}
