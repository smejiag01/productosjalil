"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ModalCliente from "@/app/(dashboard)/clientes/ModalCliente";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Field from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Input, Select } from "@/components/ui/campos";
import { buttonClass } from "@/components/ui/clases";
import {
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  Phone,
  PhoneCall,
  Store,
  UserPlus,
  Users,
} from "@/components/ui/icons";
import MapaVisitas from "./MapaVisitas";
import type { JornadaPanel, Opcion, VisitaPanel } from "./tipos";

interface Props {
  jornadas: JornadaPanel[];
  vendedores: Opcion[];
  rutas: Opcion[];
  filtro: { desde: string; hasta: string; vendedorId: string | null };
}

function enlaceMaps(v: VisitaPanel): string {
  return `https://www.google.com/maps/search/?api=1&query=${v.latitud},${v.longitud}`;
}

export default function PanelVisitas({ jornadas, vendedores, rutas, filtro }: Props) {
  const router = useRouter();
  const mapaRef = useRef<HTMLDivElement>(null);
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [visitaACliente, setVisitaACliente] = useState<VisitaPanel | null>(null);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const visitas = useMemo(() => jornadas.flatMap((j) => j.visitas), [jornadas]);
  const conUbicacion = useMemo(
    () => visitas.filter((v) => v.latitud !== null && v.longitud !== null),
    [visitas]
  );
  const pasadasACliente = visitas.filter((v) => v.clienteId).length;
  const sinFinalizar = jornadas.filter((j) => !j.horaFin).length;

  const params = new URLSearchParams({ desde: filtro.desde, hasta: filtro.hasta });
  if (filtro.vendedorId) params.set("vendedor", filtro.vendedorId);
  const urlExcel = `/api/visitas/exportar?${params.toString()}`;

  function cambiarFiltro(cambios: Partial<{ desde: string; hasta: string; vendedor: string }>) {
    const p = new URLSearchParams({ desde: filtro.desde, hasta: filtro.hasta });
    if (filtro.vendedorId) p.set("vendedor", filtro.vendedorId);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) p.set(clave, valor);
      else p.delete(clave);
    }
    router.push(`/visitas?${p.toString()}`);
  }

  function verEnMapa(id: string) {
    setSeleccionId(null);
    // Se reinicia para que elegir la misma visita dos veces vuelva a centrarla.
    requestAnimationFrame(() => setSeleccionId(id));
    mapaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function enviarAPorContactar(v: VisitaPanel) {
    setError("");
    setAviso("");
    setEnviandoId(v.id);
    try {
      const res = await fetch(`/api/visitas/${v.id}/por-contactar`, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "No se pudo enviar a Por contactar");
        return;
      }
      setAviso(`${v.nombreEmpresa} quedó en Por contactar.`);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setEnviandoId(null);
    }
  }

  async function enlazarCliente(visita: VisitaPanel, cliente: { id: string }) {
    try {
      const res = await fetch(`/api/visitas/${visita.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: cliente.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      setAviso(`${visita.nombreEmpresa} ya es cliente.`);
    } catch {
      // El cliente sí se creó; solo falló marcar la visita.
      setError("El cliente se creó, pero no se pudo marcar la visita. Recarga la página.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Visitas"
        subtitle="Informe diario de visitas de los vendedores"
        actions={
          <a href={urlExcel} className={buttonClass({ variant: "secondary" })}>
            <Download aria-hidden="true" className="h-4 w-4" />
            Exportar Excel
          </a>
        }
      />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Desde">
            {(p) => (
              <Input
                {...p}
                type="date"
                value={filtro.desde}
                max={filtro.hasta}
                onChange={(e) => e.target.value && cambiarFiltro({ desde: e.target.value })}
              />
            )}
          </Field>
          <Field label="Hasta">
            {(p) => (
              <Input
                {...p}
                type="date"
                value={filtro.hasta}
                min={filtro.desde}
                onChange={(e) => e.target.value && cambiarFiltro({ hasta: e.target.value })}
              />
            )}
          </Field>
          <Field label="Vendedor">
            {(p) => (
              <Select
                {...p}
                value={filtro.vendedorId ?? ""}
                onChange={(e) => cambiarFiltro({ vendedor: e.target.value })}
              >
                <option value="">Todos</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Días de visitas" value={jornadas.length} icon={<Clock aria-hidden="true" className="h-5 w-5" />} />
        <StatCard label="Visitas" value={visitas.length} tone="brand" icon={<Store aria-hidden="true" className="h-5 w-5" />} />
        <StatCard label="Pasadas a cliente" value={pasadasACliente} tone="ok" icon={<Users aria-hidden="true" className="h-5 w-5" />} />
        <StatCard
          label="Días sin finalizar"
          value={sinFinalizar}
          tone={sinFinalizar > 0 ? "warn" : "neutral"}
          icon={<Clock aria-hidden="true" className="h-5 w-5" />}
        />
      </div>

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}
      {aviso && (
        <Alert tone="success" className="mb-4">
          {aviso}
        </Alert>
      )}

      {jornadas.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Store aria-hidden="true" className="h-6 w-6" />}
            title="No hay visitas en estas fechas"
            description="Cuando un vendedor inicie su día de visitas en la app, aparecerá aquí. Los vendedores se crean en Usuarios con el rol Vendedor."
          />
        </Card>
      ) : (
        <>
          {conUbicacion.length > 0 && (
            <div ref={mapaRef} className="mb-6">
              <MapaVisitas visitas={conUbicacion} seleccionId={seleccionId} />
              {vendedores.length > 1 && (
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600">
                  {Array.from(new Map(jornadas.map((j) => [j.vendedor, j.colorVendedor]))).map(([nombre, color]) => (
                    <li key={nombre} className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      {nombre}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="space-y-4">
            {jornadas.map((j) => (
              <Card key={j.id} padding="none">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-ink-200 p-4 sm:px-5">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink-900">
                      {j.fechaLabel} · {j.ciudad}
                    </h2>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-ink-600">
                      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: j.colorVendedor }} />
                      {j.vendedor} · Ingreso {j.horaInicio}
                      {j.horaFin && ` · Salida ${j.horaFin}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">
                      {j.visitas.length} visita{j.visitas.length === 1 ? "" : "s"}
                    </Badge>
                    {!j.horaFin && <Badge tone="warn">Sin finalizar</Badge>}
                  </div>
                </div>

                {j.visitas.length === 0 ? (
                  <p className="p-4 text-sm text-ink-600 sm:px-5">Aún no registra visitas en este día.</p>
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {j.visitas.map((v) => {
                      const tieneUbicacion = v.latitud !== null && v.longitud !== null;
                      return (
                        <li key={v.id} className="p-4 sm:px-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold tabular-nums text-ink-600">{v.hora}</span>
                                <span className="font-semibold text-ink-900">{v.nombreEmpresa}</span>
                                <Badge tone="brand">{v.nicho}</Badge>
                              </div>
                              <dl className="mt-1 space-y-0.5 text-sm text-ink-700">
                                {v.direccion && (
                                  <div className="flex gap-1.5">
                                    <dt className="sr-only">Dirección</dt>
                                    <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
                                    <dd>{v.direccion}</dd>
                                  </div>
                                )}
                                {(v.telefono || v.contacto) && (
                                  <div className="flex gap-1.5">
                                    <dt className="sr-only">Teléfono y contacto</dt>
                                    <Phone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
                                    <dd>
                                      {v.telefono && (
                                        <a href={`tel:${v.telefono}`} className="font-medium text-brand hover:underline">
                                          {v.telefono}
                                        </a>
                                      )}
                                      {v.telefono && v.contacto && " · "}
                                      {v.contacto}
                                    </dd>
                                  </div>
                                )}
                                {v.observaciones && (
                                  <div>
                                    <dt className="sr-only">Observaciones</dt>
                                    <dd className="whitespace-pre-line text-ink-600">{v.observaciones}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {tieneUbicacion ? (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => verEnMapa(v.id)}>
                                    <MapPin aria-hidden="true" className="h-4 w-4" />
                                    Ver en mapa
                                  </Button>
                                  <a
                                    href={enlaceMaps(v)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={buttonClass({ variant: "ghost", size: "sm" })}
                                  >
                                    Google Maps
                                  </a>
                                </>
                              ) : (
                                <span className="text-sm text-ink-500">Sin ubicación</span>
                              )}

                              {v.clienteId ? (
                                <Link href={`/clientes/${v.clienteId}`}>
                                  <Badge tone="ok" icon={<CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />}>
                                    Cliente: {v.clienteNombre}
                                  </Badge>
                                </Link>
                              ) : (
                                <>
                                  <Button size="sm" variant="secondary" onClick={() => setVisitaACliente(v)}>
                                    <UserPlus aria-hidden="true" className="h-4 w-4" />
                                    Pasar a cliente
                                  </Button>
                                  {v.enPorContactar ? (
                                    <Badge tone="info">En Por contactar</Badge>
                                  ) : (
                                    v.telefono && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        loading={enviandoId === v.id}
                                        onClick={() => enviarAPorContactar(v)}
                                      >
                                        <PhoneCall aria-hidden="true" className="h-4 w-4" />
                                        Por contactar
                                      </Button>
                                    )
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {visitaACliente && (
        <ModalCliente
          rutas={rutas}
          clienteInicial={{
            nombre: visitaACliente.nombreEmpresa,
            telefono: visitaACliente.telefono ?? "",
            direccion: visitaACliente.direccion,
            latitud: visitaACliente.latitud,
            longitud: visitaACliente.longitud,
            notas: visitaACliente.notas,
            activo: true,
          }}
          onGuardado={(cliente) => enlazarCliente(visitaACliente, cliente)}
          onCerrar={() => setVisitaACliente(null)}
        />
      )}
    </div>
  );
}
