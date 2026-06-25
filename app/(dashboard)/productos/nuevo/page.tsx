import Link from "next/link";
import FormularioProducto from "../FormularioProducto";

export default function NuevoProductoPage() {
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
        Nuevo producto
      </h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <FormularioProducto />
      </div>
    </div>
  );
}
