"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DIAS_OPCIONES } from "@/lib/dias-semana";


import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass } from "@/components/ui/clases";
import Modal from "@/components/ui/Modal";
interface Empleado {
  id: string;
  nombre: string;
}

interface Props {
  rutaInicial?: {
    id: string;
    nombre: string;
    descripcion: string | null;
    dias_semana: number[];
    empleado: { id: string; nombre: string } | null;
    activa: boolean;
  } | null;
  empleados: Empleado[];
  onCerrar: () => void;
}

export default function ModalRuta({ rutaInicial, empleados, onCerrar }: Props) {
  const router = useRouter();
  const esEdicion = !!rutaInicial;

  const [nombre, setNombre] = useState(rutaInicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(rutaInicial?.descripcion ?? "");
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>(
    rutaInicial?.dias_semana ?? []
  );
  const [empleadoId, setEmpleadoId] = useState(rutaInicial?.empleado?.id ?? "");
  const [activa, setActiva] = useState(rutaInicial?.activa ?? true);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  function toggleDia(dia: number) {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral("");
    setCargando(true);

    if (diasSeleccionados.length === 0) {
      setErrorGeneral("Selecciona al menos un día de la semana");
      setCargando(false);
      return;
    }

    const body = {
      nombre,
      descripcion: descripcion || null,
      dias_semana: diasSeleccionados,
      empleado_id: empleadoId || null,
      activa,
    };

    try {
      const url = esEdicion ? `/api/rutas/${rutaInicial!.id}` : "/api/rutas";
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
    <Modal open onClose={onCerrar} title={esEdicion ? "Editar ruta" : "Nueva ruta"} size="md">

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorGeneral && (
            <div role="alert" className="p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{errorGeneral}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Nombre de la ruta <span className="text-danger">*</span></label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className={inputClass()}
              placeholder="Ej: Ruta Centro, Ruta Norte..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Descripción</label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              className={inputClass()}
              placeholder="Descripción de la zona o área" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-2">Días de la semana <span className="text-danger">*</span></label>
            <div className="flex flex-wrap gap-2">
              {DIAS_OPCIONES.map((d) => {
                const seleccionado = diasSeleccionados.includes(d.valor);
                return (
                  <button
                    key={d.valor}
                    type="button"
                    onClick={() => toggleDia(d.valor)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      seleccionado
                        ? "bg-brand text-white border-brand"
                        : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Repartidor asignado</label>
            <select value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)}
              className={inputClass()}>
              <option value="">Sin repartidor asignado</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </div>

          {esEdicion && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-ink-800">Estado</label>
              <button type="button" onClick={() => setActiva(!activa)}
                className={`relative w-10 h-5 rounded-full transition-colors ${activa ? "bg-ok" : "bg-ink-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${activa ? "translate-x-5" : ""}`} />
              </button>
              <span className="text-sm text-ink-700">{activa ? "Activa" : "Inactiva"}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className={buttonClass({ variant: "secondary" })}>Cancelar</button>
            <button type="submit" disabled={cargando}
              className={buttonClass()}>
              {cargando && <Spinner size="sm" />}
              {esEdicion ? "Guardar cambios" : "Crear ruta"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
