"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SelectorRango({
  desdeActual,
  hastaActual,
}: {
  desdeActual: string;
  hastaActual: string;
}) {
  const router = useRouter();
  const [desde, setDesde] = useState(desdeActual);
  const [hasta, setHasta] = useState(hastaActual);

  function aplicar() {
    if (!desde || !hasta) return;
    router.push(`/pedidos?vista=rango&desde=${desde}&hasta=${hasta}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={desde}
        onChange={(e) => setDesde(e.target.value)}
        className="h-10 px-3 border border-ink-200 rounded-control text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
      />
      <span className="text-ink-500 text-sm">a</span>
      <input
        type="date"
        value={hasta}
        onChange={(e) => setHasta(e.target.value)}
        className="h-10 px-3 border border-ink-200 rounded-control text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
      />
      <button
        onClick={aplicar}
        className="h-10 px-4 bg-brand text-white rounded-control text-sm font-medium hover:bg-brand-700 transition-colors"
      >
        Aplicar
      </button>
    </div>
  );
}
