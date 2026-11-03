"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import SelectorBusqueda from "@/components/SelectorBusqueda";
import { formatearPrecio } from "@/lib/formato";

import { Search } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
import { buttonClass, inputClass } from "@/components/ui/clases";
import Modal from "@/components/ui/Modal";
interface ProductoOpt {
  id: string;
  nombre: string;
  unidad: string;
  precio_base: number;
}

interface Props {
  tipo: "insumo" | "materia_prima" | "producto_terminado";
  itemInicial?: {
    id: string;
    nombre: string;
    unidad: string;
    stock_minimo: number;
    costo_unitario: number;
    proveedor?: string | null;
    tipo_animal?: string | null;
    requiere_refrigeracion?: boolean;
    fecha_vencimiento?: string | null;
    producto_id?: string | null;
    activo: boolean;
  } | null;
  onCerrar: () => void;
}

const UNIDADES = ["kg", "unidad", "caja", "libra", "arroba", "litro", "gramo"];

export default function ModalItem({ tipo, itemInicial, onCerrar }: Props) {
  const router = useRouter();
  const esEdicion = !!itemInicial;

  const [nombre, setNombre] = useState(itemInicial?.nombre ?? "");
  const [unidad, setUnidad] = useState(itemInicial?.unidad ?? "kg");
  const [stockMinimo, setStockMinimo] = useState(itemInicial?.stock_minimo?.toString() ?? "0");
  const [costoUnitario, setCostoUnitario] = useState(itemInicial?.costo_unitario?.toString() ?? "0");
  const [proveedor, setProveedor] = useState(itemInicial?.proveedor ?? "");
  const [tipoAnimal, setTipoAnimal] = useState(itemInicial?.tipo_animal ?? "");
  const [refrigeracion, setRefrigeracion] = useState(itemInicial?.requiere_refrigeracion ?? false);
  const [fechaVencimiento, setFechaVencimiento] = useState(itemInicial?.fecha_vencimiento ?? "");
  const [productoId, setProductoId] = useState(itemInicial?.producto_id ?? "");
  const [activo, setActivo] = useState(itemInicial?.activo ?? true);
  const [productos, setProductos] = useState<ProductoOpt[]>([]);
  const [productoIdsVinculados, setProductoIdsVinculados] = useState<Set<string>>(new Set());
  const [mostrarSelectorProducto, setMostrarSelectorProducto] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (tipo === "producto_terminado") {
      fetch("/api/productos?activo=true")
        .then((r) => r.json())
        .then((d) => { if (d.success) setProductos(d.data); });

      fetch("/api/inventarios/items?tipo=producto_terminado")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            const vinculados = (d.data as { id: string; producto_id: string | null }[])
              .filter((i) => i.producto_id && i.id !== itemInicial?.id)
              .map((i) => i.producto_id as string);
            setProductoIdsVinculados(new Set(vinculados));
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  const productoSeleccionado = useMemo(
    () => productos.find((p) => p.id === productoId) ?? null,
    [productos, productoId]
  );

  const opcionesProducto = useMemo(
    () =>
      productos.map((p) => ({
        id: p.id,
        titulo: p.nombre,
        subtitulo: `${p.unidad} · ${formatearPrecio(p.precio_base)}`,
        deshabilitada: productoIdsVinculados.has(p.id),
      })),
    [productos, productoIdsVinculados]
  );

  function seleccionarProducto(id: string) {
    const p = productos.find((x) => x.id === id);
    if (!p) return;
    setProductoId(p.id);
    setNombre(p.nombre);
    setUnidad(p.unidad);
    setMostrarSelectorProducto(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (tipo === "producto_terminado" && !productoId) {
      setError("Selecciona un producto del catálogo");
      return;
    }

    setCargando(true);

    const body: Record<string, unknown> = {
      nombre,
      tipo,
      unidad,
      stock_minimo: parseFloat(stockMinimo) || 0,
      costo_unitario: parseFloat(costoUnitario) || 0,
      activo,
    };

    if (tipo === "insumo") body.proveedor = proveedor || null;
    if (tipo === "materia_prima") {
      body.tipo_animal = tipoAnimal || null;
      body.requiere_refrigeracion = refrigeracion;
    }
    if (tipo !== "insumo" && fechaVencimiento) body.fecha_vencimiento = fechaVencimiento;
    if (tipo === "producto_terminado") body.producto_id = productoId;

    try {
      const url = esEdicion ? `/api/inventarios/items/${itemInicial!.id}` : "/api/inventarios/items";
      const method = esEdicion ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Error al guardar"); setCargando(false); return; }
      router.refresh();
      onCerrar();
    } catch {
      setError("Error de conexión");
      setCargando(false);
    }
  }

  const LABELS = { insumo: "insumo", materia_prima: "materia prima", producto_terminado: "producto terminado" };

  return (
    <>
      <Modal open onClose={onCerrar} title={`${esEdicion ? "Editar" : "Nuevo"} ${LABELS[tipo]}`} size="md" dismissible={!mostrarSelectorProducto}>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div role="alert" className="p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{error}</div>}

          {tipo === "producto_terminado" ? (
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">
                Producto del catálogo <span className="text-danger">*</span>
              </label>
              <button
                type="button"
                onClick={() => setMostrarSelectorProducto(true)}
                className="w-full px-3 py-2 border border-ink-300 rounded-control text-sm text-left outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand hover:bg-ink-50 transition-colors flex items-center justify-between"
              >
                <span className={productoSeleccionado ? "text-ink-900" : "text-ink-500"}>
                  {productoSeleccionado ? productoSeleccionado.nombre : "Selecciona un producto..."}
                </span>
                <Search aria-hidden="true" className="w-4 h-4 text-ink-500 flex-shrink-0" />
              </button>
              <p className="text-xs text-ink-500 mt-1">
                El nombre y la unidad se toman del catálogo automáticamente
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">Nombre <span className="text-danger">*</span></label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
                className={inputClass()} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">Unidad</label>
              {tipo === "producto_terminado" ? (
                <input type="text" value={unidad} disabled
                  className="w-full px-3 py-2 border border-ink-200 bg-ink-50 rounded-control text-sm text-ink-600" />
              ) : (
                <select value={unidad} onChange={(e) => setUnidad(e.target.value)}
                  className={inputClass()}>
                  {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">Costo unitario (COP)</label>
              <input type="number" value={costoUnitario} onChange={(e) => setCostoUnitario(e.target.value)} min="0" step="0.01"
                className={inputClass()} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Stock mínimo</label>
            <input type="number" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} min="0" step="0.01"
              className={inputClass()} />
          </div>

          {tipo === "insumo" && (
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">Proveedor</label>
              <input type="text" value={proveedor} onChange={(e) => setProveedor(e.target.value)}
                className={inputClass()} />
            </div>
          )}

          {tipo === "materia_prima" && (
            <>
              <div>
                <label className="block text-sm font-medium text-ink-800 mb-1.5">Tipo de animal</label>
                <input type="text" value={tipoAnimal} onChange={(e) => setTipoAnimal(e.target.value)} placeholder="Ej: Res, Cerdo, Pollo..."
                  className={inputClass()} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-ink-800">Requiere refrigeración</label>
                <button type="button" onClick={() => setRefrigeracion(!refrigeracion)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${refrigeracion ? "bg-info" : "bg-ink-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${refrigeracion ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </>
          )}

          {tipo !== "insumo" && (
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-1.5">Fecha de vencimiento</label>
              <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)}
                className={inputClass()} />
            </div>
          )}

          {esEdicion && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-ink-800">Estado</label>
              <button type="button" onClick={() => setActivo(!activo)}
                className={`relative w-10 h-5 rounded-full transition-colors ${activo ? "bg-ok" : "bg-ink-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${activo ? "translate-x-5" : ""}`} />
              </button>
              <span className="text-sm text-ink-700">{activo ? "Activo" : "Inactivo"}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className={buttonClass({ variant: "secondary" })}>Cancelar</button>
            <button type="submit" disabled={cargando}
              className={buttonClass()}>
              {cargando && <Spinner size="sm" />}
              {esEdicion ? "Guardar cambios" : "Crear ítem"}
            </button>
          </div>
        </form>
      </Modal>

      {mostrarSelectorProducto && (
        <SelectorBusqueda
          titulo="Seleccionar producto del catálogo"
          placeholder="Buscar producto..."
          opciones={opcionesProducto}
          onSeleccionar={seleccionarProducto}
          onCerrar={() => setMostrarSelectorProducto(false)}
        />
      )}
    </>
  );
}
