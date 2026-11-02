"use client";

import { FormEvent, useState } from "react";

const MENSAJE_CLIENTE_NUEVO =
  "Hola, soy un cliente nuevo y quiero registrarme en la tienda en línea de Productos Jalil.";

export default function LoginFormTienda({
  whatsappAtencion,
}: {
  whatsappAtencion: string | null;
}) {
  const [nit, setNit] = useState("");
  const [celular, setCelular] = useState("");
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
        body: JSON.stringify({ nit, celular }),
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
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Entrar a la tienda</h2>
      <p className="text-gray-500 text-sm mb-6">
        Escribe tu NIT o documento y tu celular registrado para ver tus precios
        y hacer tu pedido.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="nit"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            NIT o número de documento
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h.01M7 12h.01M7 17h.01M11 7h6M11 12h6M11 17h6" />
              </svg>
            </div>
            <input
              id="nit"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder="Ej: 900123456"
              required
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="celular"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Celular registrado
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                <path d="M12 18h.01" />
              </svg>
            </div>
            <input
              id="celular"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="Ej: 312 345 6789"
              required
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-colors"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            El número de WhatsApp con el que haces tus pedidos.
          </p>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full py-3 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {cargando ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Entrar
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      </form>

      {enlaceWhatsapp && (
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-3">
            ¿Eres cliente nuevo? Escríbenos y te registramos.
          </p>
          <a
            href={enlaceWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 border-2 border-green-600 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Soy cliente nuevo
          </a>
        </div>
      )}
    </div>
  );
}
