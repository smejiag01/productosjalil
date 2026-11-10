"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";


import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass } from "@/components/ui/clases";
import Modal from "@/components/ui/Modal";
interface Props {
  usuarioInicial?: {
    id: string;
    nombre: string;
    correo: string;
    documento: string | null;
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
  const [documento, setDocumento] = useState(usuarioInicial?.documento ?? "");
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

    if (!documento.trim() && (!esEdicion || usuarioInicial?.documento)) {
      setErrorGeneral("El número de documento es obligatorio: con él se ingresa a la plataforma");
      return;
    }

    setCargando(true);

    const body: Record<string, unknown> = { nombre, correo, rol, activo };
    if (documento.trim()) body.documento = documento;
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
    <Modal open onClose={onCerrar} title={esEdicion ? "Editar usuario" : "Nuevo usuario"} size="md">

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorGeneral && (
            <div role="alert" className="p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{errorGeneral}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Nombre completo <span className="text-danger">*</span></label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className={inputClass()} placeholder="Nombre del usuario" />
          </div>

          <div>
            <label htmlFor="usuario-documento" className="block text-sm font-medium text-ink-800 mb-1.5">
              Número de documento <span className="text-danger">*</span>
            </label>
            <input id="usuario-documento" type="text" inputMode="numeric" value={documento}
              onChange={(e) => setDocumento(e.target.value)} required={!esEdicion || !!usuarioInicial?.documento}
              className={inputClass()} placeholder="Ej: 1088123456" autoComplete="off" />
            <p className="text-xs text-ink-500 mt-1">Con este número y la contraseña se ingresa a la plataforma.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Correo <span className="text-danger">*</span></label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required
              className={inputClass()} placeholder="usuario@productosjalil.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              Contraseña {esEdicion ? <span className="text-ink-500 font-normal">(dejar en blanco para no cambiarla)</span> : <span className="text-danger">*</span>}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required={!esEdicion} minLength={6}
              className={inputClass()} placeholder="Mínimo 6 caracteres" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Rol <span className="text-danger">*</span></label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              disabled={esUnoMismo}
              className="w-full px-3 py-2 border border-ink-300 rounded-control text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:bg-ink-50 disabled:text-ink-500"
            >
              <option value="admin">Administrador</option>
              <option value="repartidor">Repartidor</option>
                <option value="vendedor">Vendedor</option>
            </select>
            {esUnoMismo && (
              <p className="text-xs text-ink-500 mt-1">No puedes cambiar tu propio rol</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-ink-800">Estado</label>
            <button
              type="button"
              onClick={() => !esUnoMismo && setActivo(!activo)}
              disabled={esUnoMismo}
              className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${activo ? "bg-ok" : "bg-ink-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${activo ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-sm text-ink-700">{activo ? "Activo" : "Inactivo"}</span>
            {esUnoMismo && (
              <span className="text-xs text-ink-500">(no puedes desactivar tu propia cuenta)</span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className={buttonClass({ variant: "secondary" })}>Cancelar</button>
            <button type="submit" disabled={cargando}
              className={buttonClass()}>
              {cargando && <Spinner size="sm" />}
              {esEdicion ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
