"use client";

import { createContext, useContext, useState } from "react";

interface EdicionPedidoValor {
  editando: boolean;
  setEditando: (v: boolean) => void;
}

const EdicionPedidoContext = createContext<EdicionPedidoValor | null>(null);

export function EdicionPedidoProvider({ children }: { children: React.ReactNode }) {
  const [editando, setEditando] = useState(false);
  return (
    <EdicionPedidoContext.Provider value={{ editando, setEditando }}>
      {children}
    </EdicionPedidoContext.Provider>
  );
}

export function useEdicionPedido(): EdicionPedidoValor {
  const ctx = useContext(EdicionPedidoContext);
  if (!ctx) throw new Error("useEdicionPedido debe usarse dentro de EdicionPedidoProvider");
  return ctx;
}
