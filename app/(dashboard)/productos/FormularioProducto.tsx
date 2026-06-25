"use client";

import { useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { UNIDADES } from "@/lib/validaciones-producto";

interface DatosProducto {
  id?: string;
  nombre?: string;
  descripcion?: string | null;
  unidad?: string;
  precio_base?: number;
  activo?: boolean;
  orden?: number;
  imagen_url?: string | null;
}

interface Props {
  productoInicial?: DatosProducto;
}

export default function FormularioProducto({ productoInicial }: Props) {
  const router = useRouter();
  const esEdicion = !!productoInicial?.id;
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(productoInicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(
    productoInicial?.descripcion ?? ""
  );
  const [unidad, setUnidad] = useState(productoInicial?.unidad ?? "kg");
  const [precioBase, setPrecioBase] = useState(
    productoInicial?.precio_base?.toString() ?? ""
  );
  const [activo, setActivo] = useState(productoInicial?.activo ?? true);
  const [orden, setOrden] = useState(
    productoInicial?.orden?.toString() ?? "0"
  );
  const [imagenUrl] = useState(
    productoInicial?.imagen_url ?? null
  );
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  function handleImagenSeleccionada(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!tiposPermitidos.includes(archivo.type)) {
      setErrores((prev) => ({
        ...prev,
        imagen: "Formato no soportado. Usa JPG, PNG o WebP",
      }));
      return;
    }

    setArchivoImagen(archivo);
    setErrores((prev) => {
      const nuevo = { ...prev };
      delete nuevo.imagen;
      return nuevo;
    });

    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImagen(ev.target?.result as string);
    reader.readAsDataURL(archivo);
  }

  async function subirImagen(productoId: string): Promise<boolean> {
    if (!archivoImagen) return true;

    setSubiendoImagen(true);
    const formData = new FormData();
    formData.append("imagen", archivoImagen);

    try {
      const res = await fetch(`/api/productos/${productoId}/imagen`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        setErrorGeneral(data.error || "Error al subir la imagen");
        return false;
      }
      return true;
    } catch {
      setErrorGeneral("Error de conexión al subir la imagen");
      return false;
    } finally {
      setSubiendoImagen(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrores({});
    setErrorGeneral("");
    setCargando(true);

    const precio = parseFloat(precioBase);
    if (isNaN(precio) || precio <= 0) {
      setErrores({ precio_base: "El precio debe ser mayor a 0" });
      setCargando(false);
      return;
    }

    const body = {
      nombre,
      descripcion: descripcion || null,
      unidad,
      precio_base: precio,
      activo,
      orden: parseInt(orden) || 0,
    };

    try {
      const url = esEdicion
        ? `/api/productos/${productoInicial!.id}`
        : "/api/productos";
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

      const productoId = data.data.id;

      if (archivoImagen) {
        const ok = await subirImagen(productoId);
        if (!ok) {
          setCargando(false);
          return;
        }
      }

      router.push("/productos");
      router.refresh();
    } catch {
      setErrorGeneral("Error de conexión. Intenta de nuevo.");
      setCargando(false);
    }
  }

  const imagenMostrar = previewImagen ?? imagenUrl;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {errorGeneral && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errorGeneral}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: imagen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen del producto
          </label>
          <div
            onClick={() => inputArchivoRef.current?.click()}
            className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-brand/50 transition-colors flex items-center justify-center"
          >
            {imagenMostrar ? (
              <img
                src={imagenMostrar}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-gray-400 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <p className="text-sm">Clic para seleccionar imagen</p>
                <p className="text-xs mt-1">JPG, PNG o WebP</p>
              </div>
            )}
          </div>
          <input
            ref={inputArchivoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImagenSeleccionada}
            className="hidden"
          />
          {errores.imagen && (
            <p className="text-red-500 text-xs mt-1">{errores.imagen}</p>
          )}
          {previewImagen && (
            <p className="text-xs text-green-600 mt-1">
              Imagen seleccionada — se subirá al guardar
            </p>
          )}
        </div>

        {/* Columna derecha: campos */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="Nombre del producto"
            />
            {errores.nombre && (
              <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
              placeholder="Descripción opcional"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad <span className="text-red-500">*</span>
              </label>
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio base (COP) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={precioBase}
                  onChange={(e) => setPrecioBase(e.target.value)}
                  required
                  min="1"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  placeholder="0"
                />
              </div>
              {errores.precio_base && (
                <p className="text-red-500 text-xs mt-1">
                  {errores.precio_base}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orden en menú
              </label>
              <input
                type="number"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <p className="text-xs text-gray-400 mt-1">
                Orden en que aparece en WhatsApp
              </p>
            </div>

            {esEdicion && (
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <button
                    type="button"
                    onClick={() => setActivo(!activo)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      activo ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        activo ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.push("/productos")}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando || subiendoImagen}
          className="px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {(cargando || subiendoImagen) && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {subiendoImagen
            ? "Subiendo imagen..."
            : esEdicion
              ? "Guardar cambios"
              : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
