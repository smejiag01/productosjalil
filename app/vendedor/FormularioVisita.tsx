"use client";

import { FormEvent, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/campos";
import { Check, LocateFixed, MapPin } from "@/components/ui/icons";
import { NICHOS } from "@/lib/visitas";
import { obtenerUbicacion, type Ubicacion } from "@/lib/vendedor-local";

export interface DatosVisita {
  nicho: string;
  nombre_empresa: string;
  direccion: string;
  telefono: string;
  contacto: string;
  observaciones: string;
  ubicacion: Ubicacion | null;
}

type EstadoUbicacion = "buscando" | "lista" | "sin_ubicacion";

/**
 * Formulario de una visita (reemplaza una fila del informe en papel). La hora
 * y la ubicación se toman solas; el vendedor solo escribe los datos del negocio.
 */
export default function FormularioVisita({
  onCerrar,
  onGuardar,
}: {
  onCerrar: () => void;
  onGuardar: (datos: DatosVisita) => void;
}) {
  const [nicho, setNicho] = useState("");
  const [nichoOtro, setNichoOtro] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contacto, setContacto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [estadoUbicacion, setEstadoUbicacion] = useState<EstadoUbicacion>("buscando");
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function buscarUbicacion() {
    setEstadoUbicacion("buscando");
    const u = await obtenerUbicacion();
    setUbicacion(u);
    setEstadoUbicacion(u ? "lista" : "sin_ubicacion");
  }

  useEffect(() => {
    void buscarUbicacion();
  }, []);

  function enviar(e: FormEvent) {
    e.preventDefault();
    const nichoFinal = nicho === "Otro" ? nichoOtro.trim() : nicho;
    const nuevos: Record<string, string> = {};
    if (nichoFinal.length < 2) nuevos.nicho = "Elige el tipo de negocio";
    if (nombre.trim().length < 2) nuevos.nombre = "Escribe el nombre del negocio";
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    onGuardar({
      nicho: nichoFinal,
      nombre_empresa: nombre.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      contacto: contacto.trim(),
      observaciones: observaciones.trim(),
      ubicacion,
    });
  }

  const idFormulario = "formulario-visita";

  return (
    <Modal
      open
      onClose={onCerrar}
      title="Registrar visita"
      description="La hora y la ubicación se guardan solas."
      size="md"
      footer={
        <>
          <Button variant="secondary" size="xl" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form={idFormulario} size="xl" leftIcon={<Check aria-hidden="true" className="h-5 w-5" />}>
            Guardar visita
          </Button>
        </>
      }
    >
      <form id={idFormulario} onSubmit={enviar} className="space-y-4">
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-control border border-ink-200 bg-ink-50 p-3 text-sm"
        >
          <span className="flex items-center gap-2 text-ink-800">
            <MapPin aria-hidden="true" className="h-5 w-5 text-brand-700" />
            {estadoUbicacion === "buscando" && "Obteniendo ubicación…"}
            {estadoUbicacion === "lista" && `Ubicación lista (±${ubicacion?.precision ?? 0} m)`}
            {estadoUbicacion === "sin_ubicacion" && "Sin ubicación: revisa el GPS o el permiso"}
          </span>
          {estadoUbicacion === "sin_ubicacion" && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void buscarUbicacion()}
              leftIcon={<LocateFixed aria-hidden="true" className="h-4 w-4" />}
            >
              Reintentar
            </Button>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-800">
            Tipo de negocio <span className="text-danger">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {[...NICHOS, "Otro"].map((n) => (
              <Chip key={n} selected={nicho === n} onClick={() => setNicho(n)} className="h-11">
                {n}
              </Chip>
            ))}
          </div>
          {nicho === "Otro" && (
            <Input
              aria-label="¿Qué tipo de negocio?"
              value={nichoOtro}
              onChange={(e) => setNichoOtro(e.target.value)}
              placeholder="¿Qué tipo de negocio?"
              className="mt-2 h-12"
            />
          )}
          {errores.nicho && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
              {errores.nicho}
            </p>
          )}
        </fieldset>

        <Field label="Nombre del negocio" required error={errores.nombre}>
          {(p) => (
            <Input {...p} value={nombre} onChange={(e) => setNombre(e.target.value)} invalid={!!errores.nombre} className="h-12" />
          )}
        </Field>

        <Field label="Dirección" hint="Ej: Km 6 vía Armenia - Pereira">
          {(p) => <Input {...p} value={direccion} onChange={(e) => setDireccion(e.target.value)} className="h-12" />}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono">
            {(p) => (
              <Input
                {...p}
                type="tel"
                inputMode="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="h-12"
              />
            )}
          </Field>
          <Field label="Contacto">
            {(p) => <Input {...p} value={contacto} onChange={(e) => setContacto(e.target.value)} className="h-12" />}
          </Field>
        </div>

        <Field label="Observaciones" hint="Qué necesita, qué se le ofreció, cuándo volver…">
          {(p) => <Textarea {...p} rows={4} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />}
        </Field>

        {estadoUbicacion === "sin_ubicacion" && (
          <Alert tone="warning">
            Puedes guardar la visita sin ubicación, pero quedará marcada así en el informe.
          </Alert>
        )}
      </form>
    </Modal>
  );
}
