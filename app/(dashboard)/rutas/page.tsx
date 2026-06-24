export default function RutasPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rutas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestión de rutas de entrega y asignación de clientes
          </p>
        </div>
        <button className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors">
          + Crear ruta
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="19" r="3" />
            <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
            <circle cx="18" cy="5" r="3" />
          </svg>
          <p className="text-sm">No hay rutas creadas</p>
          <p className="text-xs text-gray-300">
            Crea una ruta para organizar las entregas
          </p>
        </div>
      </div>
    </div>
  );
}
