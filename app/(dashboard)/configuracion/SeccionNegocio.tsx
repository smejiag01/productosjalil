"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  config: {
    nombre_negocio: string;
    nit: string | null;
    direccion: string | null;
    telefono: string | null;
  };
  onGuardado: (msg: string) => void;
}

export default function SeccionNegocio({ config, onGuardado }: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState(config.nombre_negocio);
  const [nit, setNit] = useState(config.nit ?? "");
  const [direccion, setDireccion] = useState(config.direccion ?? "");
  const [telefono, setTelefono] = useState(config.telefono ?? "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_negocio: nombre,
          nit: nit || null,
          direccion: direccion || null,
          telefono: telefono || null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      } else {
        onGuardado("Datos del negocio actualizados");
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Datos del negocio
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Estos datos aparecerán en los archivos Excel exportados a Mekano
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del negocio
          </label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
          <input type="text" value={nit} onChange={(e) => setNit(e.target.value)} placeholder="Ej: 900.123.456-7"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono del negocio</label>
          <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={cargando}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2">
            {cargando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
