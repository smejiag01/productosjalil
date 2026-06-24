"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Ruta {
  id: string;
  nombre: string;
}

interface DatosCliente {
  id?: string;
  nombre?: string;
  telefono?: string;
  direccion?: string | null;
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
  const [telefono, setTelefono] = useState(clienteInicial?.telefono ?? "");
  const [direccion, setDireccion] = useState(clienteInicial?.direccion ?? "");
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
      telefono: telefono.replace(/[\s\-\(\)]/g, ""),
      direccion: direccion || null,
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {esEdicion ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <button
            onClick={onCerrar}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorGeneral && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorGeneral}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="Nombre del cliente o negocio"
            />
            {errores.nombre && (
              <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="573001234567"
            />
            <p className="text-xs text-gray-400 mt-1">
              Formato internacional sin espacios ni guiones
            </p>
            {errores.telefono && (
              <p className="text-red-500 text-xs mt-1">{errores.telefono}</p>
            )}
          </div>

          {/* Código Mekano */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código Mekano
            </label>
            <input
              type="text"
              value={codigoMekano}
              onChange={(e) => setCodigoMekano(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="MK-0001"
            />
            {!codigoMekano && (
              <p className="text-xs text-yellow-600 mt-1">
                Recomendado: el código Mekano se usa para la exportación de facturas
              </p>
            )}
            {errores.codigo_mekano && (
              <p className="text-red-500 text-xs mt-1">
                {errores.codigo_mekano}
              </p>
            )}
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="Dirección de entrega"
            />
          </div>

          {/* Ruta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ruta asignada
            </label>
            <select
              value={rutaId}
              onChange={(e) => setRutaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
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
              <label className="text-sm font-medium text-gray-700">
                Estado
              </label>
              <button
                type="button"
                onClick={() => setActivo(!activo)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  activo ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    activo ? "translate-x-5" : ""
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">
                {activo ? "Activo" : "Inactivo"}
              </span>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
              placeholder="Notas internas sobre el cliente (opcional)"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {cargando ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {esEdicion ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
