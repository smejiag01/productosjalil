"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
        <p className="text-sm">Esta ruta no tiene clientes asignados</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
      {clientes.map((c, i) => (
        <div key={c.id} className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex-shrink-0 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {c.nombre}
                {!c.activo && <span className="ml-2 text-xs text-gray-400">(inactivo)</span>}
              </p>
              {c.direccion && <p className="text-xs text-gray-400 truncate">{c.direccion}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => mover(i, "arriba")}
              disabled={guardando || i === 0}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
              title="Subir"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <button
              onClick={() => mover(i, "abajo")}
              disabled={guardando || i === clientes.length - 1}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
              title="Bajar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
