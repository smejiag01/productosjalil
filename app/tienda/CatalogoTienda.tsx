"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";
import { History, RotateCcw, Search, Star } from "@/components/ui/icons";
import { elegirCategoriaActiva } from "@/lib/tienda-ui";
import { useCarrito } from "./CartContext";
import BarraCarrito, { type LineaCarrito } from "./_componentes/BarraCarrito";
import ChipsCategorias, { type CategoriaChip } from "./_componentes/ChipsCategorias";
import EncabezadoTienda from "./_componentes/EncabezadoTienda";
import FranjaProductos from "./_componentes/FranjaProductos";
import TarjetaProducto, { type ProductoTienda } from "./_componentes/TarjetaProducto";

export type { ProductoTienda } from "./_componentes/TarjetaProducto";

interface CategoriaTienda {
  id: string;
  nombre: string;
  emoji: string | null;
}

interface Props {
  nombreCliente: string;
  categorias: CategoriaTienda[];
  productos: ProductoTienda[];
  /** Ids elegidos en el panel, en orden. */
  destacadosIds: string[];
  /** Lo que este cliente pide más seguido. */
  habitualesIds: string[];
}

interface Aviso {
  tono: "info" | "warning";
  texto: string;
}

const ID_OTROS = "otros";

export default function CatalogoTienda({
  nombreCliente,
  categorias,
  productos,
  destacadosIds,
  habitualesIds,
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
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [yendo, setYendo] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  // Primera categoría con productos: así el chip inicial ya sale marcado desde el primer pintado.
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(
    () => categorias.find((c) => productos.some((p) => p.categoria_id === c.id))?.id ?? null
  );
  const [alturaFija, setAlturaFija] = useState(160);

  const bloqueTope = useRef<HTMLDivElement>(null);
  const ignorarScrollHasta = useRef(0);

  const productosPorId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  const destacados = useMemo(
    () => destacadosIds.map((id) => productosPorId.get(id)).filter((p): p is ProductoTienda => !!p),
    [destacadosIds, productosPorId]
  );
  const habituales = useMemo(
    () => habitualesIds.map((id) => productosPorId.get(id)).filter((p): p is ProductoTienda => !!p),
    [habitualesIds, productosPorId]
  );

  const lineasCarrito: LineaCarrito[] = useMemo(
    () =>
      items
        .map((i) => {
          const p = productosPorId.get(i.producto_id);
          return p ? { producto: p, cantidad: i.cantidad, subtotal: p.precio * i.cantidad } : null;
        })
        .filter((l): l is LineaCarrito => l !== null),
    [items, productosPorId]
  );
  const totalPedido = lineasCarrito.reduce((s, l) => s + l.subtotal, 0);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? productos.filter((p) => p.nombre.toLowerCase().includes(q)) : productos;
  }, [busqueda, productos]);

  const grupos = useMemo(() => {
    const porCategoria = new Map<string | null, ProductoTienda[]>();
    for (const p of filtrados) {
      const lista = porCategoria.get(p.categoria_id) ?? [];
      lista.push(p);
      porCategoria.set(p.categoria_id, lista);
    }
    const ordenados: { id: string; nombre: string; emoji: string | null; productos: ProductoTienda[] }[] = [];
    for (const c of categorias) {
      const lista = porCategoria.get(c.id);
      if (lista?.length) ordenados.push({ ...c, productos: lista });
    }
    const sin = porCategoria.get(null);
    if (sin?.length) ordenados.push({ id: ID_OTROS, nombre: "Otros productos", emoji: null, productos: sin });
    return ordenados;
  }, [filtrados, categorias]);

  const chips: CategoriaChip[] = useMemo(
    () => grupos.map((g) => ({ id: g.id, nombre: g.nombre, emoji: g.emoji })),
    [grupos]
  );

  // Alto del bloque fijo (encabezado + buscador + chips): sirve para el margen de
  // los saltos por categoría y para decidir cuál está "activa" al hacer scroll.
  useEffect(() => {
    const nodo = bloqueTope.current;
    if (!nodo) return;
    const medir = () => setAlturaFija(nodo.offsetHeight);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  // Scroll-spy: resalta el chip de la categoría que se está viendo.
  useEffect(() => {
    if (busqueda.trim() || chips.length === 0) return;
    let cuadro = 0;
    const calcular = () => {
      cuadro = 0;
      if (Date.now() < ignorarScrollHasta.current) return;
      const posiciones = chips.map((c) => ({
        id: c.id,
        top: document.getElementById(`cat-${c.id}`)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
      }));
      const alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setCategoriaActiva(elegirCategoriaActiva(posiciones, alturaFija + 24, alFinal));
    };
    const alScroll = () => {
      if (!cuadro) cuadro = requestAnimationFrame(calcular);
    };
    window.addEventListener("scroll", alScroll, { passive: true });
    calcular();
    return () => {
      window.removeEventListener("scroll", alScroll);
      if (cuadro) cancelAnimationFrame(cuadro);
    };
  }, [busqueda, chips, alturaFija]);

  function irACategoria(id: string) {
    ignorarScrollHasta.current = Date.now() + 800;
    setCategoriaActiva(id);
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function repetirUltimoPedido() {
    setRepitiendo(true);
    setAviso(null);
    try {
      const respuesta = await fetch("/api/tienda/ultimo-pedido");
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.success) {
        setAviso({ tono: "warning", texto: resultado.error ?? "No pudimos cargar tu último pedido." });
        return;
      }
      const nuevos = (resultado.data.items as { producto_id: string; cantidad: number }[]).map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
      }));
      if (nuevos.length === 0) {
        setAviso({ tono: "info", texto: "Aún no tienes un pedido anterior para repetir." });
        return;
      }
      reemplazar(nuevos);
      const removidos: string[] = resultado.data.removidos ?? [];
      setAviso(
        removidos.length > 0
          ? {
              tono: "warning",
              texto: `Cargamos tu último pedido. Quitamos productos que ya no están disponibles: ${removidos.join(", ")}.`,
            }
          : { tono: "info", texto: "Cargamos tu último pedido. Revísalo y confírmalo cuando quieras." }
      );
    } catch {
      setAviso({ tono: "warning", texto: "Error de conexión. Intenta de nuevo." });
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

  const buscando = busqueda.trim().length > 0;

  return (
    <div className="min-h-screen bg-paper pb-40">
      <div ref={bloqueTope} className="sticky top-0 z-30 shadow-sm">
        <EncabezadoTienda
          nombreCliente={nombreCliente}
          totalUnidades={totalUnidades}
          onAbrirCarrito={totalUnidades > 0 ? () => setCarritoAbierto(true) : irAlCarrito}
          onSalir={cerrarSesion}
        />
        <div className="border-b border-ink-200 bg-paper/95 backdrop-blur">
          <div className="mx-auto max-w-4xl space-y-3 px-4 py-3">
            <SearchInput
              label="Buscar producto"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={setBusqueda}
            />
            {!buscando && chips.length > 1 && (
              <ChipsCategorias categorias={chips} activa={categoriaActiva} onSeleccionar={irACategoria} />
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-5">
        <Card
          padding="sm"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 border-brand-100 bg-brand-50"
        >
          <p className="text-sm font-medium text-ink-800">¿Pides lo mismo de siempre?</p>
          <Button
            variant="secondary"
            size="md"
            loading={repitiendo}
            onClick={repetirUltimoPedido}
            leftIcon={<RotateCcw aria-hidden="true" className="h-4 w-4" />}
          >
            Repetir mi último pedido
          </Button>
        </Card>

        {aviso && (
          <Alert tone={aviso.tono} className="mb-5">
            {aviso.texto}
          </Alert>
        )}

        {!buscando && (
          <>
            <FranjaProductos
              id="destacados"
              titulo="Destacados"
              icono={<Star aria-hidden="true" className="h-5 w-5 fill-accent text-accent" />}
              productos={destacados}
              cantidadDe={cantidadDe}
              onAgregar={incrementar}
              onQuitar={decrementar}
            />
            <FranjaProductos
              id="habituales"
              titulo="Tus habituales"
              icono={<History aria-hidden="true" className="h-5 w-5 text-brand" />}
              descripcion="Lo que más pides"
              productos={habituales}
              cantidadDe={cantidadDe}
              onAgregar={incrementar}
              onQuitar={decrementar}
            />
          </>
        )}

        {buscando && (
          <p aria-live="polite" className="mb-3 text-sm text-ink-700">
            {filtrados.length === 0
              ? "Sin resultados"
              : `${filtrados.length} ${filtrados.length === 1 ? "producto" : "productos"}`}
          </p>
        )}

        {grupos.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="No encontramos productos"
              description="Prueba con otra palabra o revisa la ortografía."
              action={
                buscando ? (
                  <Button variant="secondary" onClick={() => setBusqueda("")}>
                    Limpiar búsqueda
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          grupos.map((grupo) => (
            <section
              key={grupo.id}
              id={`cat-${grupo.id}`}
              style={{ scrollMarginTop: alturaFija + 8 }}
              className="mb-8"
            >
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold text-ink-900">
                {grupo.emoji && <span aria-hidden="true">{grupo.emoji}</span>}
                {grupo.nombre}
                <span className="text-sm font-medium text-ink-600">({grupo.productos.length})</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {grupo.productos.map((p) => (
                  <TarjetaProducto
                    key={p.id}
                    producto={p}
                    cantidad={cantidadDe(p.id)}
                    onAgregar={() => incrementar(p.id)}
                    onQuitar={() => decrementar(p.id)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {totalUnidades > 0 && (
        <BarraCarrito
          lineas={lineasCarrito}
          totalUnidades={totalUnidades}
          total={totalPedido}
          abierta={carritoAbierto}
          yendo={yendo}
          onAbrir={() => setCarritoAbierto(true)}
          onCerrar={() => setCarritoAbierto(false)}
          onIncrementar={incrementar}
          onDecrementar={decrementar}
          onQuitar={quitar}
          onIrAlCarrito={irAlCarrito}
        />
      )}
    </div>
  );
}
