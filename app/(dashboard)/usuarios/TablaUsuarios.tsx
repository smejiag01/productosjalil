"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalUsuario from "./ModalUsuario";

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
}

const ROL_LABELS: Record<string, string> = {
  admin: "Administrador",
  repartidor: "Repartidor",
};

export default function TablaUsuarios({
  usuarios,
  usuarioActualId,
}: {
  usuarios: Usuario[];
  usuarioActualId: string;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [cargandoId, setCargandoId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtrados = usuarios.filter((u) =>
    busqueda
      ? u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.correo.toLowerCase().includes(busqueda.toLowerCase())
      : true
  );

  async function toggleActivo(u: Usuario) {
    setError("");
    setCargandoId(u.id);
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !u.activo }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al actualizar el usuario");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargandoId(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Usuarios</h1>
            <span className="text-sm text-gray-400 font-medium">{usuarios.length} usuarios</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Cuentas de acceso al dashboard (administradores y repartidores)</p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className="h-11 px-3 lg:px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Agregar usuario</span>
          <span className="sm:hidden">Agregar</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative w-72">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Cards móvil y tablet */}
      <div className="lg:hidden space-y-3">
        {filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
            <p className="text-sm">{busqueda ? "No se encontraron usuarios" : "No hay usuarios registrados"}</p>
          </div>
        ) : (
          filtrados.map((u) => {
            const esUnoMismo = u.id === usuarioActualId;
            return (
              <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {u.nombre} {esUnoMismo && <span className="text-gray-400 font-normal">(tú)</span>}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${u.activo ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{u.correo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ROL_LABELS[u.rol] ?? u.rol}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => toggleActivo(u)}
                    disabled={esUnoMismo || cargandoId === u.id}
                    title={esUnoMismo ? "No puedes desactivar tu propia cuenta" : undefined}
                    className="h-9 px-4 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                  <button onClick={() => { setEditando(u); setModalAbierto(true); }} className="h-9 px-4 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-brand hover:bg-gray-100 transition-colors">Editar</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400">
                  <p className="text-sm">{busqueda ? "No se encontraron usuarios" : "No hay usuarios registrados"}</p>
                </td>
              </tr>
            ) : (
              filtrados.map((u) => {
                const esUnoMismo = u.id === usuarioActualId;
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {u.nombre} {esUnoMismo && <span className="text-gray-400 font-normal">(tú)</span>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{u.correo}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{ROL_LABELS[u.rol] ?? u.rol}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${u.activo ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? "bg-green-500" : "bg-red-500"}`} />
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => toggleActivo(u)}
                          disabled={esUnoMismo || cargandoId === u.id}
                          title={esUnoMismo ? "No puedes desactivar tu propia cuenta" : undefined}
                          className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-600"
                        >
                          {u.activo ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => { setEditando(u); setModalAbierto(true); }}
                          className="text-sm text-brand hover:text-brand-light font-medium transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ModalUsuario
          usuarioInicial={editando}
          esUnoMismo={editando?.id === usuarioActualId}
          onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
