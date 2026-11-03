
import { Package } from "@/components/ui/icons";export default function InventarioPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Inventario</h1>
          <p className="text-ink-600 text-sm mt-1">
            Control de productos y existencias
          </p>
        </div>
        <button className="px-4 py-2 bg-brand text-white rounded-control text-sm font-medium hover:bg-brand-700 transition-colors">
          + Agregar producto
        </button>
      </div>

      <div className="bg-white rounded-card border border-ink-200 shadow-card p-16 text-center">
        <div className="flex flex-col items-center gap-2 text-ink-500">
          <Package aria-hidden="true" className="w-12 h-12 text-ink-300" />
          <p className="text-sm">Módulo de inventario en construcción</p>
        </div>
      </div>
    </div>
  );
}
