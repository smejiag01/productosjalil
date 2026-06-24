export default function EmpleadosPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestión del personal del negocio
          </p>
        </div>
        <button className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors">
          + Agregar empleado
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
          <p className="text-sm">No hay empleados registrados</p>
          <p className="text-xs text-gray-300">
            Agrega al personal del negocio
          </p>
        </div>
      </div>
    </div>
  );
}
