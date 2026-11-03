import Link from "next/link";
import {
  calcularRango,
  calcularRangoPersonalizado,
  hoyStr,
  toDbDate,
  toUtcInicioTs,
  toUtcFinTs,
  addDias,
} from "@/lib/analiticas/periodos";
import type { Periodo } from "@/lib/analiticas/periodos";
import SelectorPeriodo from "./SelectorPeriodo";
import { TABS, type ContextoAnalitica } from "./_tabs/comunes";
import TabClientes from "./_tabs/TabClientes";
import TabInventario from "./_tabs/TabInventario";
import TabPedidos from "./_tabs/TabPedidos";
import TabProductos from "./_tabs/TabProductos";
import TabRutas from "./_tabs/TabRutas";
import TabVentas from "./_tabs/TabVentas";

export const dynamic = "force-dynamic";

export default async function AnaliticasPage(
  props: {
    searchParams: Promise<{
      periodo?: string;
      fecha?: string;
      tab?: string;
      desde?: string;
      hasta?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const periodo = (
    ["diario", "semanal", "quincenal", "mensual"].includes(searchParams.periodo ?? "")
      ? searchParams.periodo
      : "semanal"
  ) as Periodo;

  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.fecha ?? "")
    ? searchParams.fecha!
    : hoyStr();

  const tab = TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab! : "ventas";

  const fechaValida = (s?: string) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? "");
  const esPersonalizado =
    searchParams.periodo === "personalizado" &&
    fechaValida(searchParams.desde) &&
    fechaValida(searchParams.hasta);

  // Valores por defecto para los inputs de rango libre: si aún no hay uno
  // elegido, se sugieren los últimos 7 días para que el usuario parta de algo.
  const desdeParam = fechaValida(searchParams.desde) ? searchParams.desde! : addDias(fecha, -6);
  const hastaParam = fechaValida(searchParams.hasta) ? searchParams.hasta! : fecha;

  const rango = esPersonalizado
    ? calcularRangoPersonalizado(desdeParam, hastaParam)
    : calcularRango(periodo, fecha);
  const inicioDb  = toDbDate(rango.inicio);
  const finDb     = toDbDate(rango.fin);
  const inicioAntDb = toDbDate(rango.inicioAnterior);
  const finAntDb    = toDbDate(rango.finAnterior);
  const inicioTs  = toUtcInicioTs(rango.inicio);
  const finTs     = toUtcFinTs(rango.fin);

  const ctx: ContextoAnalitica = {
    rango,
    periodo,
    esPersonalizado,
    inicioDb,
    finDb,
    inicioAntDb,
    finAntDb,
    inicioTs,
    finTs,
  };

  function tabUrl(t: string) {
    return esPersonalizado
      ? `/analiticas?periodo=personalizado&desde=${desdeParam}&hasta=${hastaParam}&tab=${t}`
      : `/analiticas?periodo=${periodo}&fecha=${fecha}&tab=${t}`;
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-ink-900 lg:text-3xl">Analíticas</h1>
          <p className="text-ink-600 text-sm mt-0.5">{rango.label}</p>
        </div>
      </div>

      {/* Selector de periodo */}
      <SelectorPeriodo
        periodo={periodo}
        fecha={fecha}
        navLabel={rango.navLabel}
        tab={tab}
        esPersonalizado={esPersonalizado}
        desde={desdeParam}
        hasta={hastaParam}
      />

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-ink-100 rounded-lg p-0.5 mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabUrl(t.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white shadow-sm text-ink-900"
                : "text-ink-600 hover:text-ink-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>


      {tab === "ventas" && <TabVentas ctx={ctx} />}
      {tab === "pedidos" && <TabPedidos ctx={ctx} />}
      {tab === "productos" && <TabProductos ctx={ctx} />}
      {tab === "clientes" && <TabClientes ctx={ctx} />}
      {tab === "inventario" && <TabInventario ctx={ctx} />}
      {tab === "rutas" && <TabRutas ctx={ctx} />}
    </div>
  );
}
