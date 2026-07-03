"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS_PQR, type EstadoPqr } from "@/lib/pqrs";

interface Props {
  pqrId: string;
  estadoActual: string;
}

export default function SelectorEstadoPqr({ pqrId, estadoActual }: Props) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function cambiarEstado(nuevoEstado: string) {
    if (nuevoEstado === estadoActual) return;
    setCargando(true);
    setError("");

    try {
      const res = await fetch(`/api/pqrs/${pqrId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al actualizar el estado");
        setCargando(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-red-500 text-xs">{error}</span>}
      <select
        value={estadoActual}
        disabled={cargando}
        onChange={(e) => cambiarEstado(e.target.value)}
        className="h-11 px-3 border border-gray-300 rounded-lg text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50"
      >
        {(Object.keys(ESTADOS_PQR) as EstadoPqr[]).map((key) => (
          <option key={key} value={key}>
            {ESTADOS_PQR[key].label}
          </option>
        ))}
      </select>
      {cargando && <div className="w-4 h-4 border-2 border-gray-300 border-t-brand rounded-full animate-spin" />}
    </div>
  );
}
