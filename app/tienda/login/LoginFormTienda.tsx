"use client";

import { FormEvent, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Input } from "@/components/ui/campos";
import { ArrowRight, MessageCircle } from "@/components/ui/icons";

const MENSAJE_CLIENTE_NUEVO =
  "Hola, soy un cliente nuevo y quiero registrarme en la tienda en línea de Productos Jalil.";

export default function LoginFormTienda({
  whatsappAtencion,
}: {
  whatsappAtencion: string | null;
}) {
  const [nit, setNit] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch("/api/tienda/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nit }),
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.success) {
        setError(resultado.error ?? "No pudimos iniciar sesión. Intenta de nuevo.");
        setCargando(false);
        return;
      }

      window.location.href = "/tienda";
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setCargando(false);
    }
  }

  const enlaceWhatsapp = whatsappAtencion
    ? `https://wa.me/${whatsappAtencion}?text=${encodeURIComponent(MENSAJE_CLIENTE_NUEVO)}`
    : null;

  return (
    <div>
      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="NIT o número de documento" required>
          {(p) => (
            <Input
              {...p}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder="Ej: 900123456"
              required
              className="h-12"
            />
          )}
        </Field>

        <Button
          type="submit"
          size="xl"
          fullWidth
          loading={cargando}
          rightIcon={<ArrowRight aria-hidden="true" className="h-5 w-5" />}
        >
          Entrar
        </Button>
      </form>

      {enlaceWhatsapp && (
        <div className="mt-6 border-t border-ink-200 pt-6 text-center">
          <p className="mb-3 text-sm text-ink-700">
            ¿Eres cliente nuevo? Escríbenos y te registramos.
          </p>
          <Button
            href={enlaceWhatsapp}
            target="_blank"
            variant="secondary"
            size="lg"
            fullWidth
            className="border-ok text-ok hover:bg-ok-soft"
            leftIcon={<MessageCircle aria-hidden="true" className="h-5 w-5" />}
          >
            Soy cliente nuevo
          </Button>
        </div>
      )}
    </div>
  );
}
