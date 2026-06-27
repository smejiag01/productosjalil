"use client";

import { useRouter } from "next/navigation";

export default function SelectorFecha({
  fechaActual,
}: {
  fechaActual: string;
}) {
  const router = useRouter();

  return (
    <input
      type="date"
      value={fechaActual}
      onChange={(e) => {
        if (e.target.value) {
          router.push(`/pedidos?fecha=${e.target.value}`);
        }
      }}
      className="h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
    />
  );
}
