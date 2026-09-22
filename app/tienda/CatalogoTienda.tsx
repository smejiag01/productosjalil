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

function Miniatura({
  producto,
  className = "",
}: {
  producto: { nombre: string; imagen_url: string | null };
  className?: string;
}) {
  if (producto.imagen_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={producto.imagen_url}
        alt={producto.nombre}
        loading="lazy"
        className={`object-cover bg-gray-100 ${className}`}
      />
    );
  }
  return (
    <div
      className={`bg-gray-100 flex items-center justify-center text-gray-300 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-1/3 h-1/3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    </div>
  );
}

export default function CatalogoTienda({
  nombreCliente,
  categorias,
  productos,
}: Props) {
  const router = useRouter();
  const {
    items,
    totalUnidades,
    cantidadDe,
    incrementar,
    decrementar,
    quitar,
    reemplazar,
    sincronizarYa,
  } = useCarrito();
  const [busqueda, setBusqueda] = useState("");
  const [repitiendo, setRepitiendo] = useState(false);
  const [avisoRepetir, setAvisoRepetir] = useState<string | null>(null);
  const [yendo, setYendo] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  const productosPorId = useMemo(
    () => new Map(productos.map((p) => [p.id, p])),
    [productos]
  );

  const lineasCarrito = useMemo(
    () =>
      items
        .map((i) => {
          const p = productosPorId.get(i.producto_id);
          if (!p) return null;
          return { producto: p, cantidad: i.cantidad, subtotal: p.precio * i.cantidad };
        })
        .filter((l): l is { producto: ProductoTienda; cantidad: number; subtotal: number } => l !== null),
    [items, productosPorId]
  );

  const totalPedido = lineasCarrito.reduce((s, l) => s + l.subtotal, 0);

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
    const ordenadas: {
      id: string | null;
      nombre: string;
      emoji: string | null;
      productos: ProductoTienda[];
    }[] = [];
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
      setAvisoRepetir(
        removidos.length > 0
          ? `Cargamos tu último pedido. Quitamos productos que ya no están disponibles: ${removidos.join(", ")}.`
          : "Cargamos tu último pedido. Revísalo y confírmalo cuando quieras."
      );
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
    <div className="min-h-screen bg-gray-50 pb-36">
      {/* Encabezado */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
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

      <div className="max-w-4xl mx-auto px-4 py-4">
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

        {/* Catálogo en cuadrícula */}
        {grupos.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No encontramos productos con esa búsqueda.
          </div>
        ) : (
          grupos.map((grupo) => (
            <section key={grupo.id ?? "otros"} className="mb-7">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                {grupo.emoji && <span>{grupo.emoji}</span>}
                {grupo.nombre}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {grupo.productos.map((p) => {
                  const cant = cantidadDe(p.id);
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col"
                    >
                      <Miniatura producto={p} className="w-full aspect-square" />
                      <div className="p-2.5 flex flex-col flex-1">
                        <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem]">
                          {p.nombre}
                        </p>
                        <p className="text-sm font-semibold text-brand mt-1">
                          {formatearPrecio(p.precio)}
                          <span className="text-xs text-gray-400 font-normal"> / {p.unidad}</span>
                        </p>
                        <div className="mt-2">
                          {cant === 0 ? (
                            <button
                              onClick={() => incrementar(p.id)}
                              className="w-full h-9 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors"
                            >
                              Agregar
                            </button>
                          ) : (
                            <div className="flex items-center justify-between gap-1">
                              <button
                                onClick={() => decrementar(p.id)}
                                aria-label="Quitar uno"
                                className="w-9 h-9 rounded-lg border border-gray-300 text-gray-700 text-lg hover:bg-gray-50 flex items-center justify-center flex-shrink-0"
                              >
                                −
                              </button>
                              <span className="flex-1 text-center text-sm font-semibold text-gray-900">
                                {cant}
                              </span>
                              <button
                                onClick={() => incrementar(p.id)}
                                aria-label="Agregar uno"
                                className="w-9 h-9 rounded-lg bg-brand text-white text-lg hover:bg-brand-light flex items-center justify-center flex-shrink-0"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Mini-carrito inferior (bottom sheet) */}
      {totalUnidades > 0 && (
        <>
          {carritoAbierto && (
            <div
              className="fixed inset-0 bg-black/30 z-20"
              onClick={() => setCarritoAbierto(false)}
            />
          )}
          <div className="fixed bottom-0 inset-x-0 z-30">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border-t border-gray-200 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                {/* Barra: resumen + toggle */}
                <button
                  onClick={() => setCarritoAbierto((v) => !v)}
                  className="w-full px-4 py-3 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <span className="bg-brand text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      {totalUnidades}
                    </span>
                    {carritoAbierto ? "Ocultar carrito" : "Ver lo que llevas"}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatearPrecio(totalPedido)}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 text-gray-400 transition-transform ${carritoAbierto ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </span>
                </button>

                {/* Lista expandible */}
                {carritoAbierto && (
                  <div className="max-h-[45vh] overflow-y-auto border-t border-gray-100 divide-y divide-gray-50">
                    {lineasCarrito.map((l) => (
                      <div key={l.producto.id} className="px-4 py-2.5 flex items-center gap-3">
                        <Miniatura
                          producto={l.producto}
                          className="w-11 h-11 rounded-lg flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {l.producto.nombre}
                          </p>
                          <p className="text-xs text-gray-500">{formatearPrecio(l.subtotal)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => decrementar(l.producto.id)}
                            aria-label="Quitar uno"
                            className="w-8 h-8 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-semibold">{l.cantidad}</span>
                          <button
                            onClick={() => incrementar(l.producto.id)}
                            aria-label="Agregar uno"
                            className="w-8 h-8 rounded-lg bg-brand text-white hover:bg-brand-light flex items-center justify-center"
                          >
                            +
                          </button>
                          <button
                            onClick={() => quitar(l.producto.id)}
                            aria-label="Eliminar"
                            className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 flex items-center justify-center"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ir al carrito */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <button
                    onClick={irAlCarrito}
                    disabled={yendo}
                    className="w-full h-12 bg-brand text-white rounded-xl font-semibold hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Ir al carrito
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
