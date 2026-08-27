"use client";

import { useEdicionPedido } from "./EdicionPedidoContext";

export default function BotonModificarPedido() {
  const { editando, setEditando } = useEdicionPedido();

  if (editando) return null;

  return (
    <button
      onClick={() => setEditando(true)}
      className="h-11 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
      </svg>
      Modificar pedido
    </button>
  );
}
