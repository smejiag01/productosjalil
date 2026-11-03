"use client";

import { useState, FormEvent } from "react";

import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass } from "@/components/ui/clases";
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
      <div className="bg-white rounded-card border border-ink-200 shadow-card p-6">
        <h2 className="text-lg font-semibold text-ink-900 mb-1">
          Correo electrónico
        </h2>
        <p className="text-sm text-ink-600 mb-4">
          Correo actual: <span className="font-medium text-ink-800">{correoActual}</span>
        </p>

        {errorCorreo && (
          <div className="mb-4 p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{errorCorreo}</div>
        )}

        <form onSubmit={handleCambiarCorreo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Nuevo correo electrónico</label>
            <input type="email" value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)}
              placeholder="nuevo@correo.com"
              className={inputClass()} />
          </div>
          <button type="submit" disabled={cargandoCorreo}
            className={buttonClass()}>
            {cargandoCorreo && <Spinner size="sm" />}
            Cambiar correo
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-card border border-ink-200 shadow-card p-6">
        <h2 className="text-lg font-semibold text-ink-900 mb-1">
          Cambiar contraseña
        </h2>
        <p className="text-sm text-ink-600 mb-4">
          Ingresa tu contraseña actual para verificar tu identidad
        </p>

        {errorPassword && (
          <div className="mb-4 p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{errorPassword}</div>
        )}

        <form onSubmit={handleCambiarPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Contraseña actual</label>
            <input type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)}
              className={inputClass()} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Nueva contraseña</label>
            <input type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)}
              className={inputClass()} />
            <p className="text-xs text-ink-500 mt-1">Mínimo 6 caracteres</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Confirmar nueva contraseña</label>
            <input type="password" value={passwordConfirmar} onChange={(e) => setPasswordConfirmar(e.target.value)}
              className={inputClass()} />
          </div>
          <button type="submit" disabled={cargandoPassword}
            className={buttonClass()}>
            {cargandoPassword && <Spinner size="sm" />}
            Cambiar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
