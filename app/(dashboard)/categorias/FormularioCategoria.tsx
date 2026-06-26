"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  categoriaInicial?: {
    id: string;
    nombre: string;
    slug: string;
    emoji: string | null;
    orden: number;
    activa: boolean;
  } | null;
  onCerrar: () => void;
}

function generarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function FormularioCategoria({
  categoriaInicial,
  onCerrar,
}: Props) {
  const router = useRouter();
  const esEdicion = !!categoriaInicial;

  const [nombre, setNombre] = useState(categoriaInicial?.nombre ?? "");
  const [slug, setSlug] = useState(categoriaInicial?.slug ?? "");
  const [slugEditadoManual, setSlugEditadoManual] = useState(esEdicion);
  const [emoji, setEmoji] = useState(categoriaInicial?.emoji ?? "");
  const [orden, setOrden] = useState(
    categoriaInicial?.orden?.toString() ?? "0"
  );
  const [activa, setActiva] = useState(categoriaInicial?.activa ?? true);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);

  function handleNombreChange(valor: string) {
    setNombre(valor);
    if (!slugEditadoManual) {
      setSlug(generarSlug(valor));
    }
  }

  function handleSlugChange(valor: string) {
    const limpio = valor.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setSlug(limpio);
    setSlugEditadoManual(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral("");
    setErrores({});
    setCargando(true);

    const body = {
      nombre,
      slug,
      emoji: emoji || null,
      orden: parseInt(orden) || 0,
      activa,
    };

    try {
      const url = esEdicion
        ? `/api/categorias/${categoriaInicial!.id}`
        : "/api/categorias";
      const method = esEdicion ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.errores) {
          const mapa: Record<string, string> = {};
          for (const err of data.errores) mapa[err.campo] = err.mensaje;
          setErrores(mapa);
        } else {
          setErrorGeneral(data.error || "Error al guardar");
        }
        setCargando(false);
        return;
      }

      router.refresh();
      onCerrar();
    } catch {
      setErrorGeneral("Error de conexión. Intenta de nuevo.");
      setCargando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {esEdicion ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button
            onClick={onCerrar}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorGeneral && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorGeneral}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="Nombre de la categoría"
            />
            {errores.nombre && (
              <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="nombre_de_la_categoria"
            />
            <p className="text-xs text-gray-400 mt-1">
              Se genera automáticamente. Solo letras minúsculas, números y
              guión bajo.
            </p>
            {errores.slug && (
              <p className="text-red-500 text-xs mt-1">{errores.slug}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emoji
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center text-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                placeholder="🥩"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orden
              </label>
              <input
                type="number"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>

          {esEdicion && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Estado
              </label>
              <button
                type="button"
                onClick={() => setActiva(!activa)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  activa ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    activa ? "translate-x-5" : ""
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">
                {activa ? "Activa" : "Inactiva"}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {cargando && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {esEdicion ? "Guardar cambios" : "Crear categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
