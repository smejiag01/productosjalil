"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DIAS_OPCIONES } from "@/lib/dias-semana";

interface Empleado {
  id: string;
  nombre: string;
}

interface Props {
  rutaInicial?: {
    id: string;
    nombre: string;
    descripcion: string | null;
    dia_semana: number | null;
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
  const [diaSemana, setDiaSemana] = useState(rutaInicial?.dia_semana?.toString() ?? "");
  const [empleadoId, setEmpleadoId] = useState(rutaInicial?.empleado?.id ?? "");
  const [activa, setActiva] = useState(rutaInicial?.activa ?? true);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral("");
    setCargando(true);

    if (!diaSemana) {
      setErrorGeneral("Selecciona un día de la semana");
      setCargando(false);
      return;
    }

    const body = {
      nombre,
      descripcion: descripcion || null,
      dia_semana: parseInt(diaSemana),
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{esEdicion ? "Editar ruta" : "Nueva ruta"}</h2>
          <button onClick={onCerrar} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorGeneral && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errorGeneral}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la ruta <span className="text-red-500">*</span></label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="Ej: Ruta Centro, Ruta Norte..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="Descripción de la zona o área" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Día de la semana <span className="text-red-500">*</span></label>
            <select value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
              <option value="">Seleccionar día...</option>
              {DIAS_OPCIONES.map((d) => (
                <option key={d.valor} value={d.valor}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repartidor asignado</label>
            <select value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
              <option value="">Sin repartidor asignado</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </div>

          {esEdicion && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <button type="button" onClick={() => setActiva(!activa)}
                className={`relative w-10 h-5 rounded-full transition-colors ${activa ? "bg-green-500" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${activa ? "translate-x-5" : ""}`} />
              </button>
              <span className="text-sm text-gray-600">{activa ? "Activa" : "Inactiva"}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={cargando}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2">
              {cargando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {esEdicion ? "Guardar cambios" : "Crear ruta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
