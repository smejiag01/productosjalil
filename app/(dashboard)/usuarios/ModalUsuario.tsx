"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  usuarioInicial?: {
    id: string;
    nombre: string;
    correo: string;
    rol: string;
    activo: boolean;
  } | null;
  esUnoMismo: boolean;
  onCerrar: () => void;
}

export default function ModalUsuario({ usuarioInicial, esUnoMismo, onCerrar }: Props) {
  const router = useRouter();
  const esEdicion = !!usuarioInicial;

  const [nombre, setNombre] = useState(usuarioInicial?.nombre ?? "");
  const [correo, setCorreo] = useState(usuarioInicial?.correo ?? "");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState(usuarioInicial?.rol ?? "admin");
  const [activo, setActivo] = useState(usuarioInicial?.activo ?? true);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral("");

    if (!esEdicion && password.length < 6) {
      setErrorGeneral("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);

    const body: Record<string, unknown> = { nombre, correo, rol, activo };
    if (!esEdicion) body.password = password;
    else if (password) body.password = password;

    try {
      const url = esEdicion ? `/api/usuarios/${usuarioInicial!.id}` : "/api/usuarios";
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
          <h2 className="text-lg font-bold text-gray-900">{esEdicion ? "Editar usuario" : "Nuevo usuario"}</h2>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Nombre del usuario" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo <span className="text-red-500">*</span></label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="usuario@productosjalil.com" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol <span className="text-red-500">*</span></label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              disabled={esUnoMismo}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="admin">Administrador</option>
              <option value="repartidor">Repartidor</option>
            </select>
            {esUnoMismo && (
              <p className="text-xs text-gray-400 mt-1">No puedes cambiar tu propio rol</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Estado</label>
            <button
              type="button"
              onClick={() => !esUnoMismo && setActivo(!activo)}
              disabled={esUnoMismo}
              className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${activo ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${activo ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-sm text-gray-600">{activo ? "Activo" : "Inactivo"}</span>
            {esUnoMismo && (
              <span className="text-xs text-gray-400">(no puedes desactivar tu propia cuenta)</span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={cargando}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2">
              {cargando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {esEdicion ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
