"use client";

import { useEdicionPedido } from "./EdicionPedidoContext";

import { SquarePen } from "@/components/ui/icons";
export default function BotonModificarPedido() {
  const { editando, setEditando } = useEdicionPedido();

  if (editando) return null;

  return (
    <button
      onClick={() => setEditando(true)}
      className="h-11 px-4 bg-white border border-ink-300 text-ink-800 rounded-lg text-sm font-medium hover:bg-ink-50 transition-colors flex items-center justify-center gap-2"
    >
      <SquarePen aria-hidden="true" className="w-4 h-4" />
      Modificar pedido
    </button>
  );
}
