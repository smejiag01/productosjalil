"use client";

import { signIn, getSession } from "next-auth/react";
import { rutaInicioPorRol } from "@/lib/rutas-acceso";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import IconButton from "@/components/ui/IconButton";
import { Input } from "@/components/ui/campos";
import { ArrowRight, Eye, EyeOff } from "@/components/ui/icons";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const rawCallback = searchParams.get("callbackUrl") || "/pedidos";
  const callbackUrl = rawCallback.startsWith("http")
    ? new URL(rawCallback).pathname
    : rawCallback;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const resultado = await signIn("credentials", {
        correo,
        password,
        redirect: false,
      });

      if (resultado?.error) {
        setError("Correo o contraseña incorrectos");
        setCargando(false);
      } else {
        const session = await getSession();
        const rol = (session?.user as { rol?: string } | undefined)?.rol;
        window.location.href = rol === "repartidor" || rol === "vendedor" ? rutaInicioPorRol(rol) : callbackUrl;
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setCargando(false);
    }
  }

  return (
    <div>
      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Correo electrónico" required>
          {(p) => (
            <Input
              {...p}
              type="email"
              autoComplete="username"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              required
              className="h-12"
            />
          )}
        </Field>

        <Field label="Contraseña" required>
          {(p) => (
            <div className="relative">
              <Input
                {...p}
                type={mostrarPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 pr-12"
              />
              <IconButton
                aria-label={mostrarPassword ? "Ocultar la contraseña" : "Mostrar la contraseña"}
                aria-pressed={mostrarPassword}
                size="sm"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
              >
                {mostrarPassword ? (
                  <EyeOff aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Eye aria-hidden="true" className="h-5 w-5" />
                )}
              </IconButton>
            </div>
          )}
        </Field>

        <Button
          type="submit"
          size="xl"
          fullWidth
          loading={cargando}
          rightIcon={<ArrowRight aria-hidden="true" className="h-5 w-5" />}
        >
          Iniciar sesión
        </Button>
      </form>
    </div>
  );
}
