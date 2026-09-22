"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

export interface ItemCarrito {
  producto_id: string;
  cantidad: number;
}

interface CarritoContextValor {
  items: ItemCarrito[];
  totalUnidades: number;
  cantidadDe: (productoId: string) => number;
  incrementar: (productoId: string) => void;
  decrementar: (productoId: string) => void;
  fijarCantidad: (productoId: string, cantidad: number) => void;
  quitar: (productoId: string) => void;
  reemplazar: (items: ItemCarrito[]) => void;
  limpiar: () => void;
  /** Fuerza el guardado inmediato del carrito en la cookie (antes de navegar). */
  sincronizarYa: () => Promise<void>;
}

const CarritoContext = createContext<CarritoContextValor | null>(null);

export function useCarrito(): CarritoContextValor {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CartProvider>");
  return ctx;
}

export default function CartProvider({
  initialItems,
  children,
}: {
  initialItems: ItemCarrito[];
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<ItemCarrito[]>(initialItems ?? []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendiente = useRef<ItemCarrito[]>(initialItems ?? []);

  const persistir = useCallback(async (data: ItemCarrito[]) => {
    try {
      await fetch("/api/tienda/carrito", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: data }),
      });
    } catch {
      // silencioso: el carrito en memoria sigue siendo la fuente de verdad
    }
  }, []);

  const programarSync = useCallback(
    (data: ItemCarrito[]) => {
      pendiente.current = data;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        persistir(data);
        timer.current = null;
      }, 500);
    },
    [persistir]
  );

  const actualizar = useCallback(
    (updater: (prev: ItemCarrito[]) => ItemCarrito[]) => {
      setItems((prev) => {
        const next = updater(prev).filter((i) => i.cantidad > 0);
        programarSync(next);
        return next;
      });
    },
    [programarSync]
  );

  const fijarCantidad = useCallback(
    (productoId: string, cantidad: number) =>
      actualizar((prev) => {
        if (prev.some((i) => i.producto_id === productoId)) {
          return prev.map((i) =>
            i.producto_id === productoId ? { ...i, cantidad } : i
          );
        }
        return [...prev, { producto_id: productoId, cantidad }];
      }),
    [actualizar]
  );

  const incrementar = useCallback(
    (productoId: string) =>
      actualizar((prev) => {
        if (prev.some((i) => i.producto_id === productoId)) {
          return prev.map((i) =>
            i.producto_id === productoId
              ? { ...i, cantidad: i.cantidad + 1 }
              : i
          );
        }
        return [...prev, { producto_id: productoId, cantidad: 1 }];
      }),
    [actualizar]
  );

  const decrementar = useCallback(
    (productoId: string) =>
      actualizar((prev) =>
        prev.map((i) =>
          i.producto_id === productoId
            ? { ...i, cantidad: i.cantidad - 1 }
            : i
        )
      ),
    [actualizar]
  );

  const quitar = useCallback(
    (productoId: string) =>
      actualizar((prev) => prev.filter((i) => i.producto_id !== productoId)),
    [actualizar]
  );

  const reemplazar = useCallback(
    (nuevos: ItemCarrito[]) => actualizar(() => nuevos),
    [actualizar]
  );

  const limpiar = useCallback(() => actualizar(() => []), [actualizar]);

  const sincronizarYa = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await persistir(pendiente.current);
  }, [persistir]);

  const cantidadDe = useCallback(
    (productoId: string) =>
      items.find((i) => i.producto_id === productoId)?.cantidad ?? 0,
    [items]
  );

  const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <CarritoContext.Provider
      value={{
        items,
        totalUnidades,
        cantidadDe,
        incrementar,
        decrementar,
        fijarCantidad,
        quitar,
        reemplazar,
        limpiar,
        sincronizarYa,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}
