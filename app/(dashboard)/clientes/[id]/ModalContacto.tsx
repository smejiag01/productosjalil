"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  clienteId: string;
  contactoInicial?: {
    id: string;
    telefono: string;
    nombre: string | null;
    principal: boolean;
  } | null;
  onCerrar: () => void;
}

export default function ModalContacto({ clienteId, contactoInicial, onCerrar }: Props) {
  const router = useRouter();
  const esEdicion = !!contactoInicial;

  const [telefono, setTelefono] = useState(contactoInicial?.telefono ?? "");
  const [nombre, setNombre] = useState(contactoInicial?.nombre ?? "");
  const [principal, setPrincipal] = useState(contactoInicial?.principal ?? false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral("");
    setCargando(true);

    const body = {
      telefono,
      nombre: nombre || null,
      principal,
    };

    try {
      const url = esEdicion
        ? `/api/clientes/${clienteId}/contactos/${contactoInicial!.id}`
        : `/api/clientes/${clienteId}/contactos`;
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
      <div className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{esEdicion ? "Editar contacto" : "Nuevo contacto"}</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-red-500">*</span></label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="573001234567" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              placeholder="Quién hace los pedidos desde este número" />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Contacto principal</label>
            <button type="button" onClick={() => setPrincipal(!principal)}
              className={`relative w-10 h-5 rounded-full transition-colors ${principal ? "bg-green-500" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${principal ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-xs text-gray-400">{principal ? "Sí" : "No"}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={cargando}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2">
              {cargando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {esEdicion ? "Guardar cambios" : "Agregar contacto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
