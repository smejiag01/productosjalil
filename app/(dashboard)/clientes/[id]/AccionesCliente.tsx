"use client";

import { useState } from "react";
import ModalCliente from "../ModalCliente";

interface Props {
  cliente: {
    id: string;
    nombre: string;
    telefono: string;
    direccion: string | null;
    codigo_mekano: string | null;
    ruta_id: string | null;
    activo: boolean;
    notas: string | null;
  };
  rutas: { id: string; nombre: string }[];
}

export default function AccionesCliente({ cliente, rutas }: Props) {
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <>
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
