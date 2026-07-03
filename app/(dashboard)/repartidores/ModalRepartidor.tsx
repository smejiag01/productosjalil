"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface RutaOpt {
  id: string;
  nombre: string;
}

interface Props {
  repartidorInicial?: {
    id: string;
    nombre: string;
    correo: string;
    activo: boolean;
    rutas_asignadas: RutaOpt[];
  } | null;
  rutas: RutaOpt[];
  onCerrar: () => void;
}

export default function ModalRepartidor({ repartidorInicial, rutas, onCerrar }: Props) {
  const router = useRouter();
  const esEdicion = !!repartidorInicial;

  const [nombre, setNombre] = useState(repartidorInicial?.nombre ?? "");
  const [correo, setCorreo] = useState(repartidorInicial?.correo ?? "");
  const [password, setPassword] = useState("");
  const [activo, setActivo] = useState(repartidorInicial?.activo ?? true);
  const [rutaIds, setRutaIds] = useState<Set<string>>(
    new Set(repartidorInicial?.rutas_asignadas.map((r) => r.id) ?? [])
  );
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  function toggleRuta(id: string) {
    setRutaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral("");

    if (!esEdicion && password.length < 6) {
      setErrorGeneral("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);

    const body: Record<string, unknown> = {
      nombre,
      correo,
      activo,
      ruta_ids: Array.from(rutaIds),
    };
    if (!esEdicion) body.password = password;
    else if (password) body.password = password;

    try {
      const url = esEdicion ? `/api/repartidores/${repartidorInicial!.id}` : "/api/repartidores";
      const method = esEdicion ? "PATCH" : "POST";

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();

      if (!data.success) {
        setErrorGeneral(data.error || "Error al guardar");
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
          <h2 className="text-lg font-bold text-gray-900">{esEdicion ? "Editar repartidor" : "Nuevo repartidor"}</h2>
          <button onClick={onCerrar} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorGeneral && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errorGeneral}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo <span className="text-red-500">*</span></label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Nombre del repartidor" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo / usuario <span className="text-red-500">*</span></label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="repartidor@productosjalil.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña {esEdicion ? <span className="text-gray-400 font-normal">(dejar en blanco para no cambiarla)</span> : <span className="text-red-500">*</span>}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required={!esEdicion} minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Mínimo 6 caracteres" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rutas asignadas</label>
            {rutas.length === 0 ? (
              <p className="text-xs text-gray-400">No hay rutas activas para asignar</p>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-40 overflow-y-auto">
                {rutas.map((r) => (
                  <label key={r.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={rutaIds.has(r.id)} onChange={() => toggleRuta(r.id)} className="w-4 h-4 accent-brand" />
                    <span className="text-sm text-gray-700">{r.nombre}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {esEdicion && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <button type="button" onClick={() => setActivo(!activo)}
                className={`relative w-10 h-5 rounded-full transition-colors ${activo ? "bg-green-500" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${activo ? "translate-x-5" : ""}`} />
              </button>
              <span className="text-sm text-gray-600">{activo ? "Activo" : "Inactivo"}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={cargando}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2">
              {cargando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {esEdicion ? "Guardar cambios" : "Crear repartidor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
