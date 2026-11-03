"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ChevronDown, ChevronUp } from "@/components/ui/icons";
interface Cliente {
  id: string;
  nombre: string;
  direccion: string | null;
  orden_ruta: number | null;
  activo: boolean;
}

export default function OrdenClientesRuta({
  clientesIniciales,
}: {
  clientesIniciales: Cliente[];
}) {
  const router = useRouter();
  const [clientes, setClientes] = useState(clientesIniciales);
  const [guardando, setGuardando] = useState(false);

  async function mover(index: number, direccion: "arriba" | "abajo") {
    const destino = direccion === "arriba" ? index - 1 : index + 1;
    if (destino < 0 || destino >= clientes.length) return;

    const reordenados = [...clientes];
    [reordenados[index], reordenados[destino]] = [reordenados[destino], reordenados[index]];
    setClientes(reordenados);

    setGuardando(true);
    await fetch("/api/clientes/orden-ruta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        reordenados.map((c, i) => ({ id: c.id, orden_ruta: i }))
      ),
    });
    setGuardando(false);
    router.refresh();
  }

  if (clientes.length === 0) {
    return (
      <div className="bg-white rounded-card border border-ink-200 shadow-card py-16 text-center text-ink-500">
        <p className="text-sm">Esta ruta no tiene clientes asignados</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card border border-ink-200 shadow-card divide-y divide-ink-50">
      {clientes.map((c, i) => (
        <div key={c.id} className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex-shrink-0 w-7 h-7 bg-ink-100 rounded-full flex items-center justify-center text-xs font-semibold text-ink-700">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-900 truncate">
                {c.nombre}
                {!c.activo && <span className="ml-2 text-xs text-ink-500">(inactivo)</span>}
              </p>
              {c.direccion && <p className="text-xs text-ink-500 truncate">{c.direccion}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => mover(i, "arriba")}
              disabled={guardando || i === 0}
              className="p-1.5 text-ink-500 hover:text-ink-800 hover:bg-ink-100 rounded disabled:opacity-30"
              title="Subir"
            >
              <ChevronUp aria-hidden="true" className="w-4 h-4" />
            </button>
            <button
              onClick={() => mover(i, "abajo")}
              disabled={guardando || i === clientes.length - 1}
              className="p-1.5 text-ink-500 hover:text-ink-800 hover:bg-ink-100 rounded disabled:opacity-30"
              title="Bajar"
            >
              <ChevronDown aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
