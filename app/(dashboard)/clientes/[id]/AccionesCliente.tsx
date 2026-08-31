"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalCliente from "../ModalCliente";

interface Props {
  cliente: {
    id: string;
    nombre: string;
    razon_social: string | null;
    nit: string | null;
    telefono: string;
    direccion: string | null;
    codigo_mekano: string | null;
    ruta_id: string | null;
    activo: boolean;
    notas: string | null;
  };
  rutas: { id: string; nombre: string }[];
  puedeEliminar: boolean;
}

export default function AccionesCliente({ cliente, rutas, puedeEliminar }: Props) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);

  async function alternarEstado() {
    const accion = cliente.activo ? "archivar" : "reactivar";
    const confirmado = window.confirm(
      cliente.activo
        ? `¿Archivar a ${cliente.nombre}? Dejará de aparecer como cliente activo, pero conserva su historial de pedidos.`
        : `¿Reactivar a ${cliente.nombre}?`
    );
    if (!confirmado) return;

    setProcesando(true);
    try {
      const respuesta = cliente.activo
        ? await fetch(`/api/clientes/${cliente.id}`, { method: "DELETE" })
        : await fetch(`/api/clientes/${cliente.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activo: true }),
          });

      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.error ?? `No se pudo ${accion} el cliente`);
      }
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : `Error al ${accion} el cliente`);
    } finally {
      setProcesando(false);
    }
  }

  async function eliminarPermanente() {
    const confirmado = window.confirm(
      `¿Eliminar definitivamente a ${cliente.nombre}?\n\nEsto borra el cliente, sus contactos, sedes y precios personalizados sin dejar historial. No se puede deshacer.`
    );
    if (!confirmado) return;

    setProcesando(true);
    try {
      const respuesta = await fetch(`/api/clientes/${cliente.id}?permanente=true`, {
        method: "DELETE",
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.error ?? "No se pudo eliminar el cliente");
      }
      router.push("/clientes");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar el cliente");
      setProcesando(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setModalAbierto(true)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
          Editar cliente
        </button>
        <button
          onClick={alternarEstado}
          disabled={procesando}
          className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${
            cliente.activo
              ? "bg-white border-red-200 text-red-600 hover:bg-red-50"
              : "bg-white border-green-200 text-green-700 hover:bg-green-50"
          }`}
        >
          {cliente.activo ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8v13H3V8" />
                <path d="M1 3h22v5H1z" />
                <path d="M10 12h4" />
              </svg>
              {procesando ? "Archivando..." : "Archivar cliente"}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              {procesando ? "Reactivando..." : "Reactivar cliente"}
            </>
          )}
        </button>
        {puedeEliminar && (
          <button
            onClick={eliminarPermanente}
            disabled={procesando}
            title="No tiene pedidos ni PQRs registrados, así que se puede eliminar sin dejar historial"
            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            Eliminar cliente
          </button>
        )}
      </div>
      {modalAbierto && (
        <ModalCliente
          rutas={rutas}
          clienteInicial={cliente}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </>
  );
}
