"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatearPrecio } from "@/lib/formato";
import { useCarrito } from "./CartContext";

export interface ProductoTienda {
  id: string;
  nombre: string;
  nombre_corto: string | null;
  unidad: string;
  imagen_url: string | null;
  categoria_id: string | null;
  precio: number;
}

interface CategoriaTienda {
  id: string;
  nombre: string;
  emoji: string | null;
}

interface Props {
  nombreCliente: string;
  categorias: CategoriaTienda[];
  productos: ProductoTienda[];
}

export default function CatalogoTienda({
  nombreCliente,
  categorias,
  productos,
}: Props) {
  const router = useRouter();
  const { items, totalUnidades, cantidadDe, incrementar, decrementar, reemplazar, sincronizarYa } =
    useCarrito();
  const [busqueda, setBusqueda] = useState("");
  const [repitiendo, setRepitiendo] = useState(false);
  const [avisoRepetir, setAvisoRepetir] = useState<string | null>(null);
  const [yendo, setYendo] = useState(false);

  const productosPorId = useMemo(
    () => new Map(productos.map((p) => [p.id, p])),
    [productos]
  );

  const totalPedido = useMemo(
    () =>
      items.reduce((suma, i) => {
        const p = productosPorId.get(i.producto_id);
        return suma + (p ? p.precio * i.cantidad : 0);
      }, 0),
    [items, productosPorId]
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [busqueda, productos]);

  const grupos = useMemo(() => {
    const porCategoria = new Map<string | null, ProductoTienda[]>();
    for (const p of filtrados) {
      const clave = p.categoria_id;
      if (!porCategoria.has(clave)) porCategoria.set(clave, []);
      porCategoria.get(clave)!.push(p);
    }
    const ordenadas: { id: string | null; nombre: string; emoji: string | null; productos: ProductoTienda[] }[] = [];
    for (const c of categorias) {
      const lista = porCategoria.get(c.id);
      if (lista && lista.length > 0) {
        ordenadas.push({ id: c.id, nombre: c.nombre, emoji: c.emoji, productos: lista });
      }
    }
    const sinCategoria = porCategoria.get(null);
    if (sinCategoria && sinCategoria.length > 0) {
      ordenadas.push({ id: null, nombre: "Otros productos", emoji: null, productos: sinCategoria });
    }
    return ordenadas;
  }, [filtrados, categorias]);

  async function repetirUltimoPedido() {
    setRepitiendo(true);
    setAvisoRepetir(null);
    try {
      const respuesta = await fetch("/api/tienda/ultimo-pedido");
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.success) {
        setAvisoRepetir(resultado.error ?? "No pudimos cargar tu último pedido.");
        return;
      }
      const nuevos = (resultado.data.items as { producto_id: string; cantidad: number }[]).map(
        (i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })
      );
      if (nuevos.length === 0) {
        setAvisoRepetir("Aún no tienes un pedido anterior para repetir.");
        return;
      }
      reemplazar(nuevos);
      const removidos: string[] = resultado.data.removidos ?? [];
      if (removidos.length > 0) {
        setAvisoRepetir(
          `Cargamos tu último pedido. Quitamos productos que ya no están disponibles: ${removidos.join(", ")}.`
        );
      } else {
        setAvisoRepetir("Cargamos tu último pedido. Revísalo y confírmalo cuando quieras.");
      }
    } catch {
      setAvisoRepetir("Error de conexión. Intenta de nuevo.");
    } finally {
      setRepitiendo(false);
    }
  }

  async function irAlCarrito() {
    setYendo(true);
    await sincronizarYa();
    router.push("/tienda/carrito");
  }

  async function cerrarSesion() {
    await fetch("/api/tienda/auth/logout", { method: "POST" });
    window.location.href = "/tienda/login";
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Encabezado */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              PJ
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{nombreCliente}</p>
              <p className="text-xs text-gray-400">Productos Jalil</p>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium flex-shrink-0"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Buscador + repetir */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <button
            onClick={repetirUltimoPedido}
            disabled={repitiendo}
            className="px-4 py-2.5 bg-white border border-brand/30 text-brand rounded-lg text-sm font-medium hover:bg-brand/5 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {repitiendo ? "Cargando..." : "Repetir mi último pedido"}
          </button>
        </div>

        {avisoRepetir && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            {avisoRepetir}
          </div>
        )}

        {/* Catálogo */}
        {grupos.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No encontramos productos con esa búsqueda.
          </div>
        ) : (
          grupos.map((grupo) => (
            <section key={grupo.id ?? "otros"} className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                {grupo.emoji && <span>{grupo.emoji}</span>}
                {grupo.nombre}
              </h2>
              <div className="space-y-2">
                {grupo.productos.map((p) => {
                  const cant = cantidadDe(p.id);
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{p.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {formatearPrecio(p.precio)}{" "}
                          <span className="text-gray-400">/ {p.unidad}</span>
                        </p>
                      </div>
                      {cant === 0 ? (
                        <button
                          onClick={() => incrementar(p.id)}
                          className="px-3 h-9 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors flex-shrink-0"
                        >
                          Agregar
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => decrementar(p.id)}
                            aria-label="Quitar uno"
                            className="w-9 h-9 rounded-lg border border-gray-300 text-gray-700 text-lg font-medium hover:bg-gray-50 flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-gray-900">
                            {cant}
                          </span>
                          <button
                            onClick={() => incrementar(p.id)}
                            aria-label="Agregar uno"
                            className="w-9 h-9 rounded-lg bg-brand text-white text-lg font-medium hover:bg-brand-light flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Barra inferior con el carrito */}
      {totalUnidades > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-20">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <button
              onClick={irAlCarrito}
              disabled={yendo}
              className="w-full h-12 bg-brand text-white rounded-xl font-semibold hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center justify-between px-4"
            >
              <span className="flex items-center gap-2">
                <span className="bg-white/20 rounded-full px-2 py-0.5 text-sm">
                  {totalUnidades}
                </span>
                Ver carrito
              </span>
              <span>{formatearPrecio(totalPedido)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
