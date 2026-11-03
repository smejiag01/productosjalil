"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormularioCategoria from "./FormularioCategoria";

import { Plus } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/clases";
interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  emoji: string | null;
  orden: number;
  activa: boolean;
  num_productos: number;
}

export default function TablaCategorias({
  categorias,
}: {
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [errorEliminar, setErrorEliminar] = useState("");

  async function handleEliminar(id: string) {
    setEliminando(id);
    setErrorEliminar("");

    try {
      const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!data.success) {
        setErrorEliminar(data.error);
        setEliminando(null);
        return;
      }

      router.refresh();
    } catch {
      setErrorEliminar("Error de conexión");
    } finally {
      setEliminando(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">
              Categorías
            </h1>
            <span className="text-sm text-ink-500">
              {categorias.length} categorías
            </span>
          </div>
          <p className="text-ink-600 text-sm mt-1">
            Organización de productos por categoría
          </p>
        </div>
        <button
          onClick={() => {
            setEditando(null);
            setModalAbierto(true);
          }}
          className={buttonClass({ className: "flex-shrink-0" })}
        >
          <Plus aria-hidden="true" className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva categoría</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {errorEliminar && (
        <div className="mb-4 p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">
          {errorEliminar}
        </div>
      )}

      {/* Cards móvil y tablet */}
      <div className="lg:hidden space-y-3">
        {categorias.length === 0 ? (
          <div className="bg-white rounded-card border border-ink-200 shadow-card py-16 text-center text-ink-500">
            <p className="text-sm">No hay categorías creadas</p>
            <p className="text-xs text-ink-300 mt-1">
              Crea categorías para organizar tus productos
            </p>
          </div>
        ) : (
          categorias.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-card border border-ink-200 shadow-card p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {c.emoji && (
                    <span className="text-xl flex-shrink-0">{c.emoji}</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">
                      {c.nombre}
                    </p>
                    <p className="text-xs text-ink-500 font-mono">
                      {c.slug}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${
                    c.activa
                      ? "bg-ok-soft border-ok/30 text-ok"
                      : "bg-danger-soft border-danger/30 text-danger"
                  }`}
                >
                  {c.activa ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                <div className="flex items-center gap-3 text-xs text-ink-600">
                  <span>Orden: {c.orden}</span>
                  <span>{c.num_productos} productos</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditando(c);
                      setModalAbierto(true);
                    }}
                    className="h-9 px-3 bg-ink-50 border border-ink-200 rounded-control text-xs font-medium text-brand hover:bg-ink-100 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(c.id)}
                    disabled={eliminando === c.id}
                    className="h-9 px-3 bg-ink-50 border border-ink-200 rounded-control text-xs font-medium text-danger hover:bg-danger-soft transition-colors disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-card border border-ink-200 shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider w-12"></th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Slug
              </th>
              <th className="text-center py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Orden
              </th>
              <th className="text-center py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Productos
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-ink-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {categorias.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-16 text-center text-ink-500"
                >
                  <p className="text-sm">No hay categorías creadas</p>
                </td>
              </tr>
            ) : (
              categorias.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-ink-50/50 transition-colors"
                >
                  <td className="py-3 px-4 text-center text-xl">
                    {c.emoji || "—"}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-ink-900">
                    {c.nombre}
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-600 font-mono">
                    {c.slug}
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-700 text-center">
                    {c.orden}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-ink-100 rounded-full text-sm font-medium text-ink-800">
                      {c.num_productos}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        c.activa
                          ? "bg-ok-soft border-ok/30 text-ok"
                          : "bg-danger-soft border-danger/30 text-danger"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.activa ? "bg-ok" : "bg-danger"
                        }`}
                      />
                      {c.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditando(c);
                          setModalAbierto(true);
                        }}
                        className="text-sm text-brand hover:text-brand-700 font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(c.id)}
                        disabled={eliminando === c.id}
                        className="text-sm text-danger hover:text-danger font-medium transition-colors disabled:opacity-50"
                      >
                        {eliminando === c.id ? "..." : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <FormularioCategoria
          categoriaInicial={editando}
          onCerrar={() => {
            setModalAbierto(false);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}
