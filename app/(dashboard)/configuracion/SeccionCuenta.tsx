"use client";

import { useState, FormEvent } from "react";

interface Props {
  correoActual: string;
  onGuardado: (msg: string) => void;
}

export default function SeccionCuenta({ correoActual, onGuardado }: Props) {
  // Correo
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [cargandoCorreo, setCargandoCorreo] = useState(false);

  // Contraseña
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [cargandoPassword, setCargandoPassword] = useState(false);

  async function handleCambiarCorreo(e: FormEvent) {
    e.preventDefault();
    setErrorCorreo("");

    if (!nuevoCorreo) {
      setErrorCorreo("Ingresa el nuevo correo");
      return;
    }

    setCargandoCorreo(true);
    try {
      const res = await fetch("/api/auth/cuenta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "correo", nuevo_correo: nuevoCorreo }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorCorreo(data.error);
      } else {
        onGuardado("Correo actualizado correctamente");
        setNuevoCorreo("");
      }
    } catch {
      setErrorCorreo("Error de conexión");
    } finally {
      setCargandoCorreo(false);
    }
  }

  async function handleCambiarPassword(e: FormEvent) {
    e.preventDefault();
    setErrorPassword("");

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      setErrorPassword("Todos los campos son requeridos");
      return;
    }

    if (passwordNueva !== passwordConfirmar) {
      setErrorPassword("Las contraseñas no coinciden");
      return;
    }

    if (passwordNueva.length < 6) {
      setErrorPassword("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargandoPassword(true);
    try {
      const res = await fetch("/api/auth/cuenta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "password",
          password_actual: passwordActual,
          password_nueva: passwordNueva,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorPassword(data.error);
      } else {
        onGuardado("Contraseña actualizada correctamente");
        setPasswordActual("");
        setPasswordNueva("");
        setPasswordConfirmar("");
      }
    } catch {
      setErrorPassword("Error de conexión");
    } finally {
      setCargandoPassword(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Cambiar correo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Correo electrónico
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Correo actual: <span className="font-medium text-gray-700">{correoActual}</span>
        </p>

        {errorCorreo && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errorCorreo}</div>
        )}

        <form onSubmit={handleCambiarCorreo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo correo electrónico</label>
            <input type="email" value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)}
              placeholder="nuevo@correo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          <button type="submit" disabled={cargandoCorreo}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2">
            {cargandoCorreo && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Cambiar correo
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Cambiar contraseña
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Ingresa tu contraseña actual para verificar tu identidad
        </p>

        {errorPassword && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errorPassword}</div>
        )}

        <form onSubmit={handleCambiarPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
            <input type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
            <input type="password" value={passwordConfirmar} onChange={(e) => setPasswordConfirmar(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          <button type="submit" disabled={cargandoPassword}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2">
            {cargandoPassword && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Cambiar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
