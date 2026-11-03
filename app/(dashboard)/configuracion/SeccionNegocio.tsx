"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatearCelularCO } from "@/lib/formato";

import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass } from "@/components/ui/clases";
interface Props {
  config: {
    nombre_negocio: string;
    nit: string | null;
    direccion: string | null;
    telefono: string | null;
    whatsapp_atencion: string | null;
  };
  onGuardado: (msg: string) => void;
}

export default function SeccionNegocio({ config, onGuardado }: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState(config.nombre_negocio);
  const [nit, setNit] = useState(config.nit ?? "");
  const [direccion, setDireccion] = useState(config.direccion ?? "");
  const [telefono, setTelefono] = useState(config.telefono ?? "");
  const [whatsappAtencion, setWhatsappAtencion] = useState(
    config.whatsapp_atencion ? formatearCelularCO(config.whatsapp_atencion) : ""
  );
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
          whatsapp_atencion: whatsappAtencion.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      } else {
        if (data.data?.whatsapp_atencion) {
          setWhatsappAtencion(formatearCelularCO(data.data.whatsapp_atencion));
        }
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
    <div className="bg-white rounded-card border border-ink-200 shadow-card p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-ink-900 mb-1">
        Datos del negocio
      </h2>
      <p className="text-sm text-ink-600 mb-6">
        Datos generales del negocio y su canal de atención al cliente
      </p>

      {error && (
        <div className="mb-4 p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-800 mb-1.5">
            Nombre del negocio
          </label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            className={inputClass()} />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-800 mb-1.5">NIT</label>
          <input type="text" value={nit} onChange={(e) => setNit(e.target.value)} placeholder="Ej: 900.123.456-7"
            className={inputClass()} />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-800 mb-1.5">Dirección</label>
          <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)}
            className={inputClass()} />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-800 mb-1.5">Teléfono del negocio</label>
          <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)}
            className={inputClass()} />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-800 mb-1.5">
            WhatsApp de atención al cliente
          </label>
          <input type="text" inputMode="tel" value={whatsappAtencion}
            onChange={(e) => setWhatsappAtencion(e.target.value)} placeholder="Ej: 316 333 2739"
            className={inputClass()} />
          <p className="text-xs text-ink-600 mt-1">
            A este número llega el botón &quot;Soy cliente nuevo&quot; del inicio de sesión de la tienda en línea.
            Déjalo vacío para ocultar el botón.
          </p>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={cargando}
            className={buttonClass()}>
            {cargando && <Spinner size="sm" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
