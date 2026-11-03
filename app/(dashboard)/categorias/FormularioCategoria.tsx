"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";


import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass } from "@/components/ui/clases";
import Modal from "@/components/ui/Modal";
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
    <Modal open onClose={onCerrar} title={esEdicion ? "Editar categoría" : "Nueva categoría"} size="md">

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorGeneral && (
            <div role="alert" className="p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">
              {errorGeneral}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              Nombre <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              required
              className={inputClass()}
              placeholder="Nombre de la categoría"
            />
            {errores.nombre && (
              <p className="text-danger text-xs mt-1">{errores.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              Slug <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="nombre_de_la_categoria"
            />
            <p className="text-xs text-ink-500 mt-1">
              Se genera automáticamente. Solo letras minúsculas, números y
              guión bajo.
            </p>
            {errores.slug && (
              <p className="text-danger text-xs mt-1">{errores.slug}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">
                Emoji
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                maxLength={2}
                className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm text-center text-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                placeholder="🥩"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">
                Orden
              </label>
              <input
                type="number"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                min="0"
                className={inputClass()}
              />
            </div>
          </div>

          {esEdicion && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-ink-800">
                Estado
              </label>
              <button
                type="button"
                onClick={() => setActiva(!activa)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  activa ? "bg-ok" : "bg-ink-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    activa ? "translate-x-5" : ""
                  }`}
                />
              </button>
              <span className="text-sm text-ink-700">
                {activa ? "Activa" : "Inactiva"}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className={buttonClass({ variant: "secondary" })}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className={buttonClass()}
            >
              {cargando && (
                <Spinner size="sm" />
              )}
              {esEdicion ? "Guardar cambios" : "Crear categoría"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
