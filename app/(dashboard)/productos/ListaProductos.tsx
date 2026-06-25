"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  unidad: string;
  precio_base: number;
  precio_base_formateado: string;
  activo: boolean;
  orden: number;
}

type Vista = "grilla" | "tabla";

export default function ListaProductos({
  productos: productosInicial,
}: {
  productos: Producto[];
}) {
  const router = useRouter();
  const [vista, setVista] = useState<Vista>("grilla");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [reordenando, setReordenando] = useState(false);

  const productosFiltrados = productosInicial.filter((p) => {
    if (filtroEstado === "activos" && !p.activo) return false;
    if (filtroEstado === "inactivos" && p.activo) return false;
    if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      return false;
    return true;
  });

  async function moverProducto(id: string, direccion: "arriba" | "abajo") {
    const idx = productosInicial.findIndex((p) => p.id === id);
    if (idx < 0) return;
    if (direccion === "arriba" && idx === 0) return;
    if (direccion === "abajo" && idx === productosInicial.length - 1) return;

    const swap = direccion === "arriba" ? idx - 1 : idx + 1;
    const nuevoOrden = [
      { id: productosInicial[idx].id, orden: productosInicial[swap].orden },
      { id: productosInicial[swap].id, orden: productosInicial[idx].orden },
    ];

    setReordenando(true);
    await fetch("/api/productos/orden", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoOrden),
    });
    setReordenando(false);
    router.refresh();
  }

  const contadores = {
    todos: productosInicial.length,
    activos: productosInicial.filter((p) => p.activo).length,
    inactivos: productosInicial.filter((p) => !p.activo).length,
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Productos</h1>
            <span className="text-sm text-gray-400 font-medium">
              {contadores.todos} productos
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Catálogo de productos y precios base
          </p>
        </div>
        <Link
          href="/productos/nuevo"
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar producto
        </Link>
      </div>

      {/* Filtros + toggle vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["todos", "activos", "inactivos"] as const).map((f) => {
            const labels = { todos: "Todos", activos: "Activos", inactivos: "Inactivos" };
            const count = contadores[f];
            const activo = filtroEstado === f;
            return (
              <button
                key={f}
                onClick={() => setFiltroEstado(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activo
                    ? "bg-brand text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {labels[f]}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activo ? "bg-white/20" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-56 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          {/* Toggle vista */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setVista("grilla")}
              className={`p-1.5 rounded-md transition-colors ${
                vista === "grilla" ? "bg-white shadow-sm" : "text-gray-400"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setVista("tabla")}
              className={`p-1.5 rounded-md transition-colors ${
                vista === "tabla" ? "bg-white shadow-sm" : "text-gray-400"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {productosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.29 7 12 12 20.71 7" />
              <line x1="12" y1="22" x2="12" y2="12" />
            </svg>
            <p className="text-sm">
              {busqueda
                ? "No se encontraron productos"
                : "No hay productos registrados"}
            </p>
            <p className="text-xs text-gray-300">
              {busqueda
                ? "Prueba con otro término"
                : "Agrega tu primer producto para empezar"}
            </p>
          </div>
        </div>
      ) : vista === "grilla" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productosFiltrados.map((p) => (
            <Link
              key={p.id}
              href={`/productos/${p.id}/editar`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="aspect-square bg-gray-100 relative">
                {p.imagen_url ? (
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
                {!p.activo && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      Inactivo
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 group-hover:text-brand transition-colors">
                  {p.nombre}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-brand font-bold">
                    {p.precio_base_formateado}
                  </span>
                  <span className="text-xs text-gray-400">/{p.unidad}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Orden: {p.orden}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase w-10">
                  #
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                  Producto
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                  Unidad
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                  Precio base
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                  Orden
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productosFiltrados.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {p.imagen_url ? (
                          <img
                            src={p.imagen_url}
                            alt={p.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {p.nombre}
                        </p>
                        {p.descripcion && (
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">
                            {p.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {p.unidad}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                    {p.precio_base_formateado}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        p.activo
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.activo ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => moverProducto(p.id, "arriba")}
                        disabled={reordenando}
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
                        title="Subir"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-400 w-6 text-center">
                        {p.orden}
                      </span>
                      <button
                        onClick={() => moverProducto(p.id, "abajo")}
                        disabled={reordenando}
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
                        title="Bajar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/productos/${p.id}/editar`}
                      className="text-sm text-brand hover:text-brand-light font-medium"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
