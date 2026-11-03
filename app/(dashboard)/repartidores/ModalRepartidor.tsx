"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";


import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass } from "@/components/ui/clases";
import Modal from "@/components/ui/Modal";
interface RutaOpt {
  id: string;
  nombre: string;
}

interface Props {
  repartidorInicial?: {
    id: string;
    nombre: string;
    correo: string;
    activo: boolean;
    rutas_asignadas: RutaOpt[];
  } | null;
  rutas: RutaOpt[];
  onCerrar: () => void;
}

export default function ModalRepartidor({ repartidorInicial, rutas, onCerrar }: Props) {
  const router = useRouter();
  const esEdicion = !!repartidorInicial;

  const [nombre, setNombre] = useState(repartidorInicial?.nombre ?? "");
  const [correo, setCorreo] = useState(repartidorInicial?.correo ?? "");
  const [password, setPassword] = useState("");
  const [activo, setActivo] = useState(repartidorInicial?.activo ?? true);
  const [rutaIds, setRutaIds] = useState<Set<string>>(
    new Set(repartidorInicial?.rutas_asignadas.map((r) => r.id) ?? [])
  );
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  function toggleRuta(id: string) {
    setRutaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral("");

    if (!esEdicion && password.length < 6) {
      setErrorGeneral("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);

    const body: Record<string, unknown> = {
      nombre,
      correo,
      activo,
      ruta_ids: Array.from(rutaIds),
    };
    if (!esEdicion) body.password = password;
    else if (password) body.password = password;

    try {
      const url = esEdicion ? `/api/repartidores/${repartidorInicial!.id}` : "/api/repartidores";
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
    <Modal open onClose={onCerrar} title={esEdicion ? "Editar repartidor" : "Nuevo repartidor"} size="md">

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorGeneral && (
            <div role="alert" className="p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{errorGeneral}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Nombre completo <span className="text-danger">*</span></label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className={inputClass()} placeholder="Nombre del repartidor" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Correo / usuario <span className="text-danger">*</span></label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required
              className={inputClass()} placeholder="repartidor@productosjalil.com" />
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
            <label className="block text-sm font-medium text-ink-800 mb-2">Rutas asignadas</label>
            {rutas.length === 0 ? (
              <p className="text-xs text-ink-500">No hay rutas activas para asignar</p>
            ) : (
              <div className="border border-ink-200 rounded-lg divide-y divide-ink-50 max-h-40 overflow-y-auto">
                {rutas.map((r) => (
                  <label key={r.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-ink-50">
                    <input type="checkbox" checked={rutaIds.has(r.id)} onChange={() => toggleRuta(r.id)} className="w-4 h-4 accent-brand" />
                    <span className="text-sm text-ink-800">{r.nombre}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {esEdicion && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-ink-800">Estado</label>
              <button type="button" onClick={() => setActivo(!activo)}
                className={`relative w-10 h-5 rounded-full transition-colors ${activo ? "bg-ok" : "bg-ink-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${activo ? "translate-x-5" : ""}`} />
              </button>
              <span className="text-sm text-ink-700">{activo ? "Activo" : "Inactivo"}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className={buttonClass({ variant: "secondary" })}>Cancelar</button>
            <button type="submit" disabled={cargando}
              className={buttonClass()}>
              {cargando && <Spinner size="sm" />}
              {esEdicion ? "Guardar cambios" : "Crear repartidor"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
