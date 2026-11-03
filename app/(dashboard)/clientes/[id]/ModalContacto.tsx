"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";


import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass } from "@/components/ui/clases";
import Modal from "@/components/ui/Modal";
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
    <Modal open onClose={onCerrar} title={esEdicion ? "Editar contacto" : "Nuevo contacto"} size="md">

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorGeneral && (
            <div role="alert" className="p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{errorGeneral}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Teléfono <span className="text-danger">*</span></label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} required
              className={inputClass()}
              placeholder="573001234567" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              className={inputClass()}
              placeholder="Quién hace los pedidos desde este número" />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-ink-800">Contacto principal</label>
            <button type="button" onClick={() => setPrincipal(!principal)}
              className={`relative w-10 h-5 rounded-full transition-colors ${principal ? "bg-ok" : "bg-ink-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${principal ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-xs text-ink-500">{principal ? "Sí" : "No"}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className={buttonClass({ variant: "secondary" })}>Cancelar</button>
            <button type="submit" disabled={cargando}
              className={buttonClass()}>
              {cargando && <Spinner size="sm" />}
              {esEdicion ? "Guardar cambios" : "Agregar contacto"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
