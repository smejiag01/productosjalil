"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ProductoOpt {
  id: string;
  nombre: string;
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
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (tipo === "producto_terminado") {
      fetch("/api/productos?activo=true")
        .then((r) => r.json())
        .then((d) => { if (d.success) setProductos(d.data); });
    }
  }, [tipo]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
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
    if (tipo === "producto_terminado") body.producto_id = productoId || null;

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {esEdicion ? "Editar" : "Nuevo"} {LABELS[tipo]}
          </h2>
          <button onClick={onCerrar} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <select value={unidad} onChange={(e) => setUnidad(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo unitario (COP)</label>
              <input type="number" value={costoUnitario} onChange={(e) => setCostoUnitario(e.target.value)} min="0" step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
            <input type="number" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} min="0" step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>

          {tipo === "insumo" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <input type="text" value={proveedor} onChange={(e) => setProveedor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
          )}

          {tipo === "materia_prima" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de animal</label>
                <input type="text" value={tipoAnimal} onChange={(e) => setTipoAnimal(e.target.value)} placeholder="Ej: Res, Cerdo, Pollo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Requiere refrigeración</label>
                <button type="button" onClick={() => setRefrigeracion(!refrigeracion)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${refrigeracion ? "bg-blue-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${refrigeracion ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </>
          )}

          {tipo !== "insumo" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
              <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
          )}

          {tipo === "producto_terminado" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto del catálogo (opcional)</label>
              <select value={productoId} onChange={(e) => setProductoId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                <option value="">Sin vincular</option>
                {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          )}

          {esEdicion && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <button type="button" onClick={() => setActivo(!activo)}
                className={`relative w-10 h-5 rounded-full transition-colors ${activo ? "bg-green-500" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${activo ? "translate-x-5" : ""}`} />
              </button>
              <span className="text-sm text-gray-600">{activo ? "Activo" : "Inactivo"}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={cargando}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center gap-2">
              {cargando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {esEdicion ? "Guardar cambios" : "Crear ítem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
