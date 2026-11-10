"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ChevronDown, ChevronUp, ImageIcon, LayoutGrid, ListIcon, Package, Plus, Search, Star } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/clases";
import { cn } from "@/lib/cn";
import { MAX_DESTACADOS } from "@/lib/destacados";
import PanelDestacados, { type ProductoDestacable } from "./PanelDestacados";
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
  destacado: boolean;
  orden_destacado: number | null;
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
  const [destacados, setDestacados] = useState<string[]>(() =>
    productosInicial
      .filter((p) => p.destacado)
      .sort((a, b) => (a.orden_destacado ?? 0) - (b.orden_destacado ?? 0))
      .map((p) => p.id)
  );
  const [guardandoDestacados, setGuardandoDestacados] = useState(false);
  const [errorDestacados, setErrorDestacados] = useState("");

  const productosPorId = useMemo(
    () => new Map<string, ProductoDestacable>(productosInicial.map((p) => [p.id, p])),
    [productosInicial]
  );

  async function guardarDestacados(ids: string[]) {
    const anteriores = destacados;
    setDestacados(ids);
    setErrorDestacados("");
    setGuardandoDestacados(true);
    try {
      const res = await fetch("/api/productos/destacados", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "No se pudo guardar");
      router.refresh();
    } catch (e) {
      setDestacados(anteriores);
      setErrorDestacados(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardandoDestacados(false);
    }
  }

  function alternarDestacado(id: string) {
    if (destacados.includes(id)) {
      guardarDestacados(destacados.filter((d) => d !== id));
    } else if (destacados.length >= MAX_DESTACADOS) {
      setErrorDestacados(`Ya hay ${MAX_DESTACADOS} destacados. Quita uno antes de agregar otro.`);
    } else {
      guardarDestacados([...destacados, id]);
    }
  }

  function botonEstrella(p: Producto, className?: string) {
    const marcado = destacados.includes(p.id);
    return (
      <button
        type="button"
        onClick={() => alternarDestacado(p.id)}
        disabled={guardandoDestacados}
        aria-pressed={marcado}
        aria-label={marcado ? `Quitar ${p.nombre} de destacados` : `Destacar ${p.nombre} en la tienda`}
        title={marcado ? "Quitar de destacados" : "Destacar en la tienda"}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:opacity-50",
          marcado ? "bg-accent text-ink-900" : "bg-white/90 text-ink-600 hover:text-ink-900",
          className
        )}
      >
        <Star aria-hidden="true" className={cn("h-5 w-5", marcado && "fill-current")} />
      </button>
    );
  }

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
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">Productos</h1>
            <span className="text-sm text-ink-500">{contadores.todos} productos</span>
          </div>
          <p className="text-ink-600 text-sm mt-1">
            Catálogo de productos y precios base
          </p>
        </div>
        <Link
          href="/productos/nuevo"
          className={buttonClass({ className: "flex-shrink-0" })}
        >
          <Plus aria-hidden="true" className="w-4 h-4" />
          Agregar producto
        </Link>
      </div>

      <PanelDestacados
        ids={destacados}
        productos={productosPorId}
        guardando={guardandoDestacados}
        error={errorDestacados}
        onCambiar={guardarDestacados}
      />

      {/* Filtros + toggle vista */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(["todos", "activos", "inactivos"] as const).map((f) => {
            const labels = { todos: "Todos", activos: "Activos", inactivos: "Inactivos" };
            const count = contadores[f];
            const activo = filtroEstado === f;
            return (
              <button
                key={f}
                onClick={() => setFiltroEstado(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  activo
                    ? "bg-brand text-white"
                    : "bg-white border border-ink-200 text-ink-700 hover:bg-ink-50"
                }`}
              >
                {labels[f]}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activo ? "bg-white/20" : "bg-ink-100 text-ink-600"
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
            <Search aria-hidden="true" className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 pr-4 py-2 border border-ink-200 rounded-control text-sm w-full sm:w-56 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          {/* Toggle vista */}
          <div className="flex bg-ink-100 rounded-control p-0.5">
            <button
              onClick={() => setVista("grilla")}
              className={`p-1.5 rounded-control transition-colors ${
                vista === "grilla" ? "bg-white shadow-sm" : "text-ink-500"
              }`}
            >
              <LayoutGrid aria-hidden="true" className="w-4 h-4" />
            </button>
            <button
              onClick={() => setVista("tabla")}
              className={`p-1.5 rounded-control transition-colors ${
                vista === "tabla" ? "bg-white shadow-sm" : "text-ink-500"
              }`}
            >
              <ListIcon aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {productosFiltrados.length === 0 ? (
        <div className="bg-white rounded-card border border-ink-200 shadow-card py-16 text-center">
          <div className="flex flex-col items-center gap-2 text-ink-500">
            <Package aria-hidden="true" className="w-12 h-12 text-ink-300" />
            <p className="text-sm">
              {busqueda
                ? "No se encontraron productos"
                : "No hay productos registrados"}
            </p>
            <p className="text-xs text-ink-300">
              {busqueda
                ? "Prueba con otro término"
                : "Agrega tu primer producto para empezar"}
            </p>
          </div>
        </div>
      ) : vista === "grilla" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productosFiltrados.map((p) => (
            <div key={p.id} className="relative">
            {botonEstrella(p, "absolute left-2 top-2 z-10 shadow-sm")}
            <Link
              href={`/productos/${p.id}/editar`}
              className="block bg-white rounded-card border border-ink-200 shadow-card overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="aspect-square bg-ink-100 relative">
                {p.imagen_url ? (
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-300">
                    <ImageIcon aria-hidden="true" className="w-16 h-16" />
                  </div>
                )}
                {!p.activo && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 bg-danger text-white text-xs rounded-full">
                      Inactivo
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-ink-900 group-hover:text-brand transition-colors">
                  {p.nombre}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-brand font-bold">
                    {p.precio_base_formateado}
                  </span>
                  <span className="text-xs text-ink-500">/{p.unidad}</span>
                </div>
                <p className="text-xs text-ink-500 mt-1">
                  Orden: {p.orden}
                </p>
              </div>
            </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase w-10">
                  #
                </th>
                <th className="py-3 px-2 w-12">
                  <span className="sr-only">Destacado</span>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">
                  Producto
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">
                  Unidad
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">
                  Precio base
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase">
                  Estado
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-ink-600 uppercase">
                  Orden
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {productosFiltrados.map((p, idx) => (
                <tr key={p.id} className="hover:bg-ink-50/50">
                  <td className="py-3 px-4 text-sm text-ink-500">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-2">
                    {botonEstrella(p, "border border-ink-200")}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-ink-100 rounded-control overflow-hidden flex-shrink-0">
                        {p.imagen_url ? (
                          <img
                            src={p.imagen_url}
                            alt={p.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-300">
                            <ImageIcon aria-hidden="true" className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900">
                          {p.nombre}
                        </p>
                        {p.descripcion && (
                          <p className="text-xs text-ink-500 truncate max-w-[200px]">
                            {p.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-700">
                    {p.unidad}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-ink-900 text-right">
                    {p.precio_base_formateado}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        p.activo
                          ? "bg-ok-soft border-ok/30 text-ok"
                          : "bg-danger-soft border-danger/30 text-danger"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.activo ? "bg-ok" : "bg-danger"
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
                        className="p-1 text-ink-500 hover:text-ink-800 hover:bg-ink-100 rounded disabled:opacity-30"
                        title="Subir"
                      >
                        <ChevronUp aria-hidden="true" className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-ink-500 w-6 text-center">
                        {p.orden}
                      </span>
                      <button
                        onClick={() => moverProducto(p.id, "abajo")}
                        disabled={reordenando}
                        className="p-1 text-ink-500 hover:text-ink-800 hover:bg-ink-100 rounded disabled:opacity-30"
                        title="Bajar"
                      >
                        <ChevronDown aria-hidden="true" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/productos/${p.id}/editar`}
                      className="text-sm text-brand hover:text-brand-700 font-medium"
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
