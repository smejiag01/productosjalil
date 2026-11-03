"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import UbicacionMapa from "@/components/UbicacionMapa";


import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass, textareaClass } from "@/components/ui/clases";
import Modal from "@/components/ui/Modal";
interface Ruta {
  id: string;
  nombre: string;
}

interface DatosCliente {
  id?: string;
  nombre?: string;
  razon_social?: string | null;
  nit?: string | null;
  telefono?: string;
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  codigo_mekano?: string | null;
  ruta_id?: string | null;
  activo?: boolean;
  notas?: string | null;
}

interface Props {
  rutas: Ruta[];
  clienteInicial?: DatosCliente;
  onCerrar: () => void;
}

export default function ModalCliente({
  rutas,
  clienteInicial,
  onCerrar,
}: Props) {
  const router = useRouter();
  const esEdicion = !!clienteInicial?.id;

  const [nombre, setNombre] = useState(clienteInicial?.nombre ?? "");
  const [razonSocial, setRazonSocial] = useState(clienteInicial?.razon_social ?? "");
  const [nit, setNit] = useState(clienteInicial?.nit ?? "");
  const [telefono, setTelefono] = useState(clienteInicial?.telefono ?? "");
  const [direccion, setDireccion] = useState(clienteInicial?.direccion ?? "");
  const [latitud, setLatitud] = useState<number | null>(clienteInicial?.latitud ?? null);
  const [longitud, setLongitud] = useState<number | null>(clienteInicial?.longitud ?? null);
  const [codigoMekano, setCodigoMekano] = useState(
    clienteInicial?.codigo_mekano ?? ""
  );
  const [rutaId, setRutaId] = useState(clienteInicial?.ruta_id ?? "");
  const [activo, setActivo] = useState(clienteInicial?.activo ?? true);
  const [notas, setNotas] = useState(clienteInicial?.notas ?? "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrores({});
    setErrorGeneral("");
    setCargando(true);

    const body = {
      nombre,
      razon_social: razonSocial || null,
      nit: nit || null,
      telefono: telefono.replace(/[\s\-\(\)]/g, ""),
      direccion: direccion || null,
      latitud,
      longitud,
      codigo_mekano: codigoMekano || null,
      ruta_id: rutaId || null,
      activo,
      notas: notas || null,
    };

    try {
      const url = esEdicion
        ? `/api/clientes/${clienteInicial!.id}`
        : "/api/clientes";
      const method = esEdicion ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.errores) {
          const mapa: Record<string, string> = {};
          for (const err of data.errores) {
            mapa[err.campo] = err.mensaje;
          }
          setErrores(mapa);
        } else {
          setErrorGeneral(data.error || "Error al guardar");
        }
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
    <Modal open onClose={onCerrar} title={esEdicion ? "Editar cliente" : "Nuevo cliente"} size="md">

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorGeneral && (
            <div role="alert" className="p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">
              {errorGeneral}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              Nombre completo <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className={inputClass()}
              placeholder="Nombre del cliente o negocio"
            />
            {errores.nombre && (
              <p className="text-danger text-xs mt-1">{errores.nombre}</p>
            )}
          </div>

          {/* Razón social */}
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              Razón social
            </label>
            <input
              type="text"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              className={inputClass()}
              placeholder="Razón social para facturación"
            />
            <p className="text-xs text-ink-500 mt-1">
              Se usa en facturación y exportaciones; el nombre es el que se muestra en pantallas y mensajes
            </p>
            {errores.razon_social && (
              <p className="text-danger text-xs mt-1">{errores.razon_social}</p>
            )}
          </div>

          {/* NIT */}
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              NIT
            </label>
            <input
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              className={inputClass()}
              placeholder="900123456-7"
            />
            {errores.nit && (
              <p className="text-danger text-xs mt-1">{errores.nit}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              Teléfono WhatsApp <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
              className={inputClass()}
              placeholder="573001234567"
            />
            <p className="text-xs text-ink-500 mt-1">
              Formato internacional sin espacios ni guiones
            </p>
            {errores.telefono && (
              <p className="text-danger text-xs mt-1">{errores.telefono}</p>
            )}
          </div>

          {/* Código Mekano */}
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              Código Mekano
            </label>
            <input
              type="text"
              value={codigoMekano}
              onChange={(e) => setCodigoMekano(e.target.value)}
              className={inputClass()}
              placeholder="MK-0001"
            />
            {!codigoMekano && (
              <p className="text-xs text-warn-soft-text mt-1">
                Recomendado: el código Mekano se usa para la exportación de facturas
              </p>
            )}
            {errores.codigo_mekano && (
              <p className="text-danger text-xs mt-1">
                {errores.codigo_mekano}
              </p>
            )}
          </div>

          {/* Dirección y ubicación en Google Maps */}
          <UbicacionMapa
            direccion={direccion}
            onDireccion={setDireccion}
            latitud={latitud}
            longitud={longitud}
            onUbicacion={(c) => {
              setLatitud(c?.lat ?? null);
              setLongitud(c?.lng ?? null);
            }}
          />

          {/* Ruta */}
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              Ruta asignada
            </label>
            <select
              value={rutaId}
              onChange={(e) => setRutaId(e.target.value)}
              className={inputClass()}
            >
              <option value="">Sin ruta asignada</option>
              {rutas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          {esEdicion && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-ink-800">
                Estado
              </label>
              <button
                type="button"
                onClick={() => setActivo(!activo)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  activo ? "bg-ok" : "bg-ink-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    activo ? "translate-x-5" : ""
                  }`}
                />
              </button>
              <span className="text-sm text-ink-700">
                {activo ? "Activo" : "Inactivo"}
              </span>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">
              Notas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className={textareaClass({ className: "resize-none" })}
              placeholder="Notas internas sobre el cliente (opcional)"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className={buttonClass({ variant: "secondary" })}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className={buttonClass()}
            >
              {cargando ? (
                <Spinner size="sm" />
              ) : null}
              {esEdicion ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
