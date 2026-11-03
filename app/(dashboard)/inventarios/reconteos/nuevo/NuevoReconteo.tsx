"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ChevronLeft } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
import { buttonClass, textareaClass } from "@/components/ui/clases";
interface Item {
  id: string;
  nombre: string;
  tipo: string;
  unidad: string;
  stock_actual: number;
}

interface Props {
  items: Item[];
}

interface Conteo {
  cantidad_fisica: string;
  nota: string;
}

const FILTROS_TIPO = [
  { key: "todos", label: "Todos" },
  { key: "insumo", label: "Insumos" },
  { key: "materia_prima", label: "Materias primas" },
  { key: "producto_terminado", label: "Prod. terminado" },
];

export default function NuevoReconteo({ items }: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [conteos, setConteos] = useState<Record<string, Conteo>>({});
  const [notaGeneral, setNotaGeneral] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const filtrados = useMemo(() => {
    return items.filter((i) => {
      if (filtroTipo !== "todos" && i.tipo !== filtroTipo) return false;
      if (busqueda && !i.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [items, filtroTipo, busqueda]);

  const todosFiltradosSeleccionados = filtrados.length > 0 && filtrados.every((i) => seleccionados.has(i.id));

  function toggleItem(item: Item) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
        setConteos((c) => ({
          ...c,
          [item.id]: c[item.id] ?? { cantidad_fisica: String(item.stock_actual), nota: "" },
        }));
      }
      return next;
    });
  }

  function toggleTodos() {
    if (todosFiltradosSeleccionados) {
      setSeleccionados((prev) => {
        const next = new Set(prev);
        filtrados.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSeleccionados((prev) => {
        const next = new Set(prev);
        filtrados.forEach((i) => next.add(i.id));
        return next;
      });
      setConteos((c) => {
        const next = { ...c };
        filtrados.forEach((i) => {
          if (!next[i.id]) next[i.id] = { cantidad_fisica: String(i.stock_actual), nota: "" };
        });
        return next;
      });
    }
  }

  function actualizarCantidad(id: string, valor: string) {
    setConteos((c) => ({ ...c, [id]: { ...c[id], cantidad_fisica: valor } }));
  }

  function actualizarNota(id: string, valor: string) {
    setConteos((c) => ({ ...c, [id]: { ...c[id], nota: valor } }));
  }

  const itemsSeleccionados = useMemo(
    () => items.filter((i) => seleccionados.has(i.id)),
    [items, seleccionados]
  );

  const resumen = useMemo(() => {
    return itemsSeleccionados.map((item) => {
      const conteo = conteos[item.id] ?? { cantidad_fisica: String(item.stock_actual), nota: "" };
      const cantidadFisica = parseFloat(conteo.cantidad_fisica);
      const diferencia = isNaN(cantidadFisica) ? 0 : cantidadFisica - item.stock_actual;
      return { item, conteo, cantidadFisica: isNaN(cantidadFisica) ? 0 : cantidadFisica, diferencia };
    });
  }, [itemsSeleccionados, conteos]);

  const conDiferencia = resumen.filter((r) => r.diferencia !== 0);

  function irAPaso2() {
    setError("");
    if (seleccionados.size === 0) {
      setError("Selecciona al menos un ítem para contar");
      return;
    }
    for (const item of itemsSeleccionados) {
      const conteo = conteos[item.id];
      if (!conteo || conteo.cantidad_fisica.trim() === "" || isNaN(parseFloat(conteo.cantidad_fisica))) {
        setError(`Ingresa la cantidad física de "${item.nombre}"`);
        return;
      }
      if (parseFloat(conteo.cantidad_fisica) < 0) {
        setError(`La cantidad física de "${item.nombre}" no puede ser negativa`);
        return;
      }
    }
    setPaso(2);
  }

  const puedeConfirmar = conDiferencia.every((r) => r.conteo.nota.trim().length > 0);

  async function confirmar() {
    setError("");
    if (!puedeConfirmar) {
      setError("Todos los ítems con diferencia deben tener una nota");
      return;
    }
    setCargando(true);
    try {
      const res = await fetch("/api/inventarios/reconteos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota_general: notaGeneral || null,
          detalles: resumen.map((r) => ({
            item_id: r.item.id,
            cantidad_fisica: r.cantidadFisica,
            nota: r.conteo.nota || null,
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al confirmar el reconteo");
        setCargando(false);
        return;
      }
      router.push(`/inventarios/reconteos/${data.data.id}`);
    } catch {
      setError("Error de conexión");
      setCargando(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/inventarios/reconteos" className="text-sm text-ink-500 hover:text-ink-700 transition-colors flex items-center gap-1 mb-1">
          <ChevronLeft aria-hidden="true" className="w-4 h-4" />
          Reconteos
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">Nuevo reconteo</h1>
        <p className="text-ink-600 text-sm mt-1">
          {paso === 1 ? "Paso 1 de 2 · Selecciona los ítems y cuenta el stock físico" : "Paso 2 de 2 · Revisa y confirma las diferencias"}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger-soft border border-danger/30 rounded-control text-danger text-sm">{error}</div>
      )}

      {paso === 1 ? (
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {FILTROS_TIPO.map((f) => (
                <button key={f.key} onClick={() => setFiltroTipo(f.key)}
                  className={`h-10 px-3 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    filtroTipo === f.key ? "bg-brand text-white" : "bg-white border border-ink-200 text-ink-700 hover:bg-ink-50"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="px-3 py-2 border border-ink-200 rounded-lg text-sm w-full sm:w-56 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>

          <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-3 bg-ink-50/50">
              <input type="checkbox" checked={todosFiltradosSeleccionados} onChange={toggleTodos} className="w-4 h-4 accent-brand" />
              <span className="text-sm font-medium text-ink-700">
                Seleccionar todos ({filtrados.length}) · {seleccionados.size} seleccionados
              </span>
            </div>
            <div className="divide-y divide-ink-50 max-h-[55vh] overflow-y-auto">
              {filtrados.length === 0 ? (
                <div className="py-12 text-center text-ink-500 text-sm">No hay ítems</div>
              ) : filtrados.map((item) => {
                const marcado = seleccionados.has(item.id);
                const conteo = conteos[item.id];
                return (
                  <div key={item.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                      <input type="checkbox" checked={marcado} onChange={() => toggleItem(item)} className="w-4 h-4 accent-brand flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">{item.nombre}</p>
                        <p className="text-xs text-ink-500">Sistema: {item.stock_actual} {item.unidad}</p>
                      </div>
                    </label>
                    {marcado && (
                      <div className="flex items-center gap-2 sm:flex-shrink-0 pl-7 sm:pl-0">
                        <input
                          type="number"
                          value={conteo?.cantidad_fisica ?? ""}
                          onChange={(e) => actualizarCantidad(item.id, e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-28 px-2 py-1.5 border border-ink-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                        />
                        <span className="text-xs text-ink-500 w-14">{item.unidad}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/inventarios/reconteos" className={buttonClass({ variant: "secondary" })}>
              Cancelar
            </Link>
            <button onClick={irAPaso2}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors">
              Continuar
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-card border border-ink-200 shadow-card overflow-hidden mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-ink-100">
              <h3 className="font-semibold text-ink-900">
                {conDiferencia.length > 0 ? `${conDiferencia.length} ítems con diferencia` : "Sin diferencias"}
              </h3>
              <p className="text-xs text-ink-500 mt-0.5">{itemsSeleccionados.length} ítems contados en total</p>
            </div>

            {conDiferencia.length === 0 ? (
              <div className="py-10 text-center text-ink-500 text-sm">
                Todos los ítems coinciden con el sistema. Puedes confirmar el reconteo igualmente.
              </div>
            ) : (
              <div className="divide-y divide-ink-50">
                {conDiferencia.map((r) => {
                  const sobrante = r.diferencia > 0;
                  return (
                    <div key={r.item.id} className="px-4 sm:px-6 py-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink-900 truncate">{r.item.nombre}</p>
                          <p className="text-xs text-ink-500">
                            Sistema: {r.item.stock_actual} {r.item.unidad} · Físico: {r.cantidadFisica} {r.item.unidad}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold flex-shrink-0 ${sobrante ? "text-ok" : "text-danger"}`}>
                          {sobrante ? "+" : ""}{r.diferencia.toFixed(2)} {r.item.unidad}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Nota (obligatoria) — motivo de la diferencia"
                        value={r.conteo.nota}
                        onChange={(e) => actualizarNota(r.item.id, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 ${
                          r.conteo.nota.trim() ? "border-ink-300 focus:border-brand" : "border-danger/30"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-ink-800 mb-1.5">Nota general (opcional)</label>
            <textarea value={notaGeneral} onChange={(e) => setNotaGeneral(e.target.value)} rows={2}
              className={textareaClass({ className: "resize-none" })} />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setPaso(1)} className={buttonClass({ variant: "secondary" })}>
              Volver
            </button>
            <button onClick={confirmar} disabled={cargando || !puedeConfirmar}
              className={buttonClass()}>
              {cargando && <Spinner size="sm" />}
              Confirmar reconteo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
