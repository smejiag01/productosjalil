"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";


import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass } from "@/components/ui/clases";
import Modal from "@/components/ui/Modal";
interface Props {
  empleadoInicial?: {
    id: string;
    nombre: string;
    cargo: string | null;
    telefono: string | null;
    activo: boolean;
  } | null;
  onCerrar: () => void;
}

export default function ModalEmpleado({ empleadoInicial, onCerrar }: Props) {
  const router = useRouter();
  const esEdicion = !!empleadoInicial;

  const [nombre, setNombre] = useState(empleadoInicial?.nombre ?? "");
  const [cargo, setCargo] = useState(empleadoInicial?.cargo ?? "");
  const [telefono, setTelefono] = useState(empleadoInicial?.telefono ?? "");
  const [activo, setActivo] = useState(empleadoInicial?.activo ?? true);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral("");
    setCargando(true);

    const body = {
      nombre,
      cargo: cargo || null,
      telefono: telefono || null,
      activo,
    };

    try {
      const url = esEdicion ? `/api/empleados/${empleadoInicial!.id}` : "/api/empleados";
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
    <Modal open onClose={onCerrar} title={esEdicion ? "Editar empleado" : "Nuevo empleado"} size="md">

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorGeneral && (
            <div role="alert" className="p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{errorGeneral}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Nombre completo <span className="text-danger">*</span></label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className={inputClass()} placeholder="Nombre del empleado" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Cargo</label>
            <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)}
              className={inputClass()} placeholder="Ej: Repartidor, Carnicero..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Teléfono</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)}
              className={inputClass()} placeholder="Teléfono de contacto" />
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
              {esEdicion ? "Guardar cambios" : "Crear empleado"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
