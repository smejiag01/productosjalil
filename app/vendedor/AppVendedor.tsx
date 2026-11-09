"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Field from "@/components/ui/Field";
import { Input } from "@/components/ui/campos";
import {
  CloudOff,
  CloudUpload,
  Flag,
  MapPin,
  Phone,
  Play,
  Plus,
  Store,
  UserRound,
} from "@/components/ui/icons";
import { horaBogota } from "@/lib/visitas";
import {
  guardarEstado,
  leerEstado,
  nuevoId,
  obtenerUbicacion,
  type EstadoLocal,
  type JornadaLocal,
  type VisitaLocal,
} from "@/lib/vendedor-local";
import FormularioVisita, { type DatosVisita } from "./FormularioVisita";

const INTERVALO_SINCRONIZACION_MS = 30_000;

interface Resultado {
  id: string | null;
  ok: boolean;
  descartar?: boolean;
  error?: string;
}

interface Resumen {
  ciudad: string;
  inicio_at: string;
  fin_at: string;
  total: number;
}

function fechaLarga(iso: string): string {
  const texto = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function AppVendedor({ usuarioId }: { usuarioId: string }) {
  const [estado, setEstado] = useState<EstadoLocal>({ jornada: null, ultimaCiudad: null, cola: [] });
  const estadoRef = useRef(estado);
  const [listo, setListo] = useState(false);
  const [enLinea, setEnLinea] = useState(true);
  const [ciudad, setCiudad] = useState("");
  const [errorCiudad, setErrorCiudad] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [confirmarFin, setConfirmarFin] = useState(false);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [aviso, setAviso] = useState("");
  const sincronizando = useRef(false);

  const actualizar = useCallback(
    (fn: (prev: EstadoLocal) => EstadoLocal) => {
      const nuevo = fn(estadoRef.current);
      estadoRef.current = nuevo;
      guardarEstado(usuarioId, nuevo);
      setEstado(nuevo);
    },
    [usuarioId]
  );

  const sincronizar = useCallback(async () => {
    const cola = estadoRef.current.cola;
    if (sincronizando.current || cola.length === 0 || !navigator.onLine) return;
    sincronizando.current = true;
    try {
      const res = await fetch("/api/vendedor/sincronizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operaciones: cola }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const resultados: Resultado[] = data?.data?.resultados ?? [];

      const enviadas = new Set<Record<string, unknown>>();
      const visitasOk = new Set<string>();
      const descartadas: string[] = [];
      resultados.forEach((r, i) => {
        const op = cola[i];
        if (!op || !(r.ok || r.descartar)) return;
        enviadas.add(op);
        if (op.tipo === "visita" && r.ok) visitasOk.add(String(op.id));
        if (r.descartar) descartadas.push(r.error ?? "Registro inválido");
      });

      actualizar((prev) => ({
        ...prev,
        cola: prev.cola.filter((op) => !enviadas.has(op)),
        jornada: prev.jornada
          ? {
              ...prev.jornada,
              visitas: prev.jornada.visitas.map((v) =>
                visitasOk.has(v.id) ? { ...v, sincronizada: true } : v
              ),
            }
          : null,
      }));
      if (descartadas.length > 0) {
        setAviso(`Un registro no se pudo guardar: ${descartadas[0]}. Avísale al administrador.`);
      }
    } catch {
      // Sin señal o servidor caído: se reintenta en el próximo ciclo.
    } finally {
      sincronizando.current = false;
    }
  }, [actualizar]);

  // Carga inicial: estado local primero (funciona sin señal) y luego el del servidor
  useEffect(() => {
    const local = leerEstado(usuarioId);
    estadoRef.current = local;
    setEstado(local);
    setCiudad(local.ultimaCiudad ?? "");
    setEnLinea(navigator.onLine);
    setListo(true);

    (async () => {
      try {
        const res = await fetch("/api/vendedor/estado");
        if (!res.ok) return;
        const data = await res.json();
        const servidor: { ultimaCiudad: string | null; jornada: (Omit<JornadaLocal, "visitas"> & { visitas: Omit<VisitaLocal, "sincronizada">[] }) | null } =
          data.data;

        actualizar((prev) => {
          const ultimaCiudad = prev.ultimaCiudad ?? servidor.ultimaCiudad;
          if (!prev.jornada) {
            if (!servidor.jornada) return { ...prev, ultimaCiudad };
            return {
              ...prev,
              ultimaCiudad,
              jornada: {
                ...servidor.jornada,
                visitas: servidor.jornada.visitas.map((v) => ({ ...v, sincronizada: true })),
              },
            };
          }
          // Jornada local abierta pero ya cerrada en el servidor y nada pendiente: se descarta
          if (!servidor.jornada && prev.cola.length === 0) return { ...prev, ultimaCiudad, jornada: null };
          if (servidor.jornada && servidor.jornada.id === prev.jornada.id) {
            const enServidor = new Set(servidor.jornada.visitas.map((v) => v.id));
            const locales = new Set(prev.jornada.visitas.map((v) => v.id));
            const deOtroLado = servidor.jornada.visitas
              .filter((v) => !locales.has(v.id))
              .map((v) => ({ ...v, sincronizada: true }));
            const visitas = [...prev.jornada.visitas, ...deOtroLado]
              .map((v) => (enServidor.has(v.id) ? { ...v, sincronizada: true } : v))
              .sort((a, b) => b.registrada_at.localeCompare(a.registrada_at));
            return { ...prev, ultimaCiudad, jornada: { ...prev.jornada, visitas } };
          }
          return { ...prev, ultimaCiudad };
        });
        setCiudad((c) => c || servidor.ultimaCiudad || "");
      } catch {
        // Sin señal: se trabaja con lo local
      }
      void sincronizar();
    })();
  }, [usuarioId, actualizar, sincronizar]);

  // Reintentos: al recuperar la señal y cada cierto tiempo
  useEffect(() => {
    const alConectar = () => {
      setEnLinea(true);
      void sincronizar();
    };
    const alDesconectar = () => setEnLinea(false);
    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    const intervalo = setInterval(() => void sincronizar(), INTERVALO_SINCRONIZACION_MS);
    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
      clearInterval(intervalo);
    };
  }, [sincronizar]);

  async function iniciarDia() {
    const nombreCiudad = ciudad.trim();
    if (nombreCiudad.length < 2) {
      setErrorCiudad("Escribe la ciudad donde vas a visitar");
      return;
    }
    setErrorCiudad("");
    setOcupado(true);
    const ubicacion = await obtenerUbicacion(10_000);
    const id = nuevoId();
    const inicio_at = new Date().toISOString();
    actualizar((prev) => ({
      ...prev,
      ultimaCiudad: nombreCiudad,
      jornada: { id, ciudad: nombreCiudad, inicio_at, visitas: [] },
      cola: [
        ...prev.cola,
        { tipo: "iniciar_jornada", id, ciudad: nombreCiudad, inicio_at, lat: ubicacion?.lat ?? null, lng: ubicacion?.lng ?? null },
      ],
    }));
    setResumen(null);
    setOcupado(false);
    void sincronizar();
  }

  function guardarVisita(datos: DatosVisita) {
    const jornada = estadoRef.current.jornada;
    if (!jornada) return;
    const id = nuevoId();
    const registrada_at = new Date().toISOString();
    const visita: VisitaLocal = {
      id,
      registrada_at,
      nicho: datos.nicho,
      nombre_empresa: datos.nombre_empresa,
      direccion: datos.direccion || null,
      telefono: datos.telefono || null,
      contacto: datos.contacto || null,
      observaciones: datos.observaciones || null,
      tieneUbicacion: datos.ubicacion !== null,
      sincronizada: false,
    };
    actualizar((prev) => ({
      ...prev,
      jornada: prev.jornada ? { ...prev.jornada, visitas: [visita, ...prev.jornada.visitas] } : prev.jornada,
      cola: [
        ...prev.cola,
        {
          tipo: "visita",
          id,
          jornada_id: jornada.id,
          registrada_at,
          nicho: datos.nicho,
          nombre_empresa: datos.nombre_empresa,
          direccion: datos.direccion,
          telefono: datos.telefono,
          contacto: datos.contacto,
          observaciones: datos.observaciones,
          lat: datos.ubicacion?.lat ?? null,
          lng: datos.ubicacion?.lng ?? null,
          precision_m: datos.ubicacion?.precision ?? null,
        },
      ],
    }));
    setFormularioAbierto(false);
    void sincronizar();
  }

  async function finalizarDia() {
    const jornada = estadoRef.current.jornada;
    if (!jornada) return;
    setOcupado(true);
    const ubicacion = await obtenerUbicacion(10_000);
    const fin_at = new Date().toISOString();
    actualizar((prev) => ({
      ...prev,
      jornada: null,
      cola: [...prev.cola, { tipo: "finalizar_jornada", id: jornada.id, fin_at, lat: ubicacion?.lat ?? null, lng: ubicacion?.lng ?? null }],
    }));
    setResumen({ ciudad: jornada.ciudad, inicio_at: jornada.inicio_at, fin_at, total: jornada.visitas.length });
    setConfirmarFin(false);
    setOcupado(false);
    void sincronizar();
  }

  if (!listo) return null;

  const { jornada, cola } = estado;
  const pendientes = cola.length;

  return (
    <div className="space-y-4">
      {(pendientes > 0 || !enLinea) && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-card border border-warn/60 bg-warn-soft p-3 text-sm text-ink-900"
        >
          <span className="flex items-center gap-2">
            {enLinea ? (
              <CloudUpload aria-hidden="true" className="h-5 w-5 flex-shrink-0" />
            ) : (
              <CloudOff aria-hidden="true" className="h-5 w-5 flex-shrink-0" />
            )}
            {enLinea
              ? `${pendientes} ${pendientes === 1 ? "registro pendiente" : "registros pendientes"} de enviar`
              : "Sin señal. Todo queda guardado en el celular y se enviará solo."}
          </span>
          {enLinea && pendientes > 0 && (
            <Button size="sm" variant="secondary" onClick={() => void sincronizar()}>
              Enviar
            </Button>
          )}
        </div>
      )}

      {aviso && (
        <Alert tone="error">
          <p>{aviso}</p>
          <button type="button" onClick={() => setAviso("")} className="mt-1 text-sm font-semibold underline">
            Entendido
          </button>
        </Alert>
      )}

      {!jornada ? (
        <section className="space-y-4 rounded-card border border-ink-300 bg-white p-5 shadow-card">
          {resumen && (
            <Alert tone="success" title="Día finalizado">
              {resumen.ciudad}: {resumen.total} {resumen.total === 1 ? "visita" : "visitas"}, de{" "}
              {horaBogota(new Date(resumen.inicio_at))} a {horaBogota(new Date(resumen.fin_at))}.
            </Alert>
          )}
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-900">Informe de visitas</h1>
            <p className="mt-1 text-base text-ink-700">{fechaLarga(new Date().toISOString())}</p>
          </div>
          <Field label="Ciudad" required error={errorCiudad}>
            {(p) => (
              <Input
                {...p}
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ej: Pereira"
                invalid={!!errorCiudad}
                className="h-12"
              />
            )}
          </Field>
          <Button
            size="xl"
            fullWidth
            loading={ocupado}
            onClick={() => void iniciarDia()}
            leftIcon={<Play aria-hidden="true" className="h-5 w-5" />}
          >
            Iniciar día de visitas
          </Button>
          <p className="text-sm text-ink-600">Se guarda la hora de ingreso y tu ubicación.</p>
        </section>
      ) : (
        <>
          <section className="rounded-card border border-ink-300 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink-700">{fechaLarga(jornada.inicio_at)}</p>
                <h1 className="font-display text-2xl font-semibold text-ink-900">{jornada.ciudad}</h1>
                <p className="mt-0.5 text-sm text-ink-700">Ingreso: {horaBogota(new Date(jornada.inicio_at))}</p>
              </div>
              <div className="rounded-control bg-brand-50 px-3 py-2 text-center">
                <p className="font-display text-2xl font-semibold tabular-nums text-brand-800">{jornada.visitas.length}</p>
                <p className="text-xs font-medium text-brand-800">{jornada.visitas.length === 1 ? "visita" : "visitas"}</p>
              </div>
            </div>
          </section>

          <Button
            size="xl"
            fullWidth
            onClick={() => setFormularioAbierto(true)}
            leftIcon={<Plus aria-hidden="true" className="h-6 w-6" />}
          >
            Registrar visita
          </Button>

          {jornada.visitas.length === 0 ? (
            <div className="rounded-card border border-ink-300 bg-white">
              <EmptyState
                icon={<Store className="h-7 w-7" />}
                title="Aún no hay visitas"
                description="Toca “Registrar visita” cada vez que visites un negocio."
              />
            </div>
          ) : (
            <ul className="space-y-3">
              {jornada.visitas.map((v) => (
                <li key={v.id} className="rounded-card border border-ink-300 bg-white p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-700">
                        {horaBogota(new Date(v.registrada_at))} · {v.nicho}
                      </p>
                      <h2 className="font-display text-lg font-semibold leading-tight text-ink-900">{v.nombre_empresa}</h2>
                    </div>
                    {!v.sincronizada && (
                      <span className="flex-shrink-0 rounded-full border border-warn/60 bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn-soft-text">
                        Por enviar
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-ink-800">
                    {v.direccion && (
                      <p className="flex items-start gap-1.5">
                        <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-600" />
                        {v.direccion}
                      </p>
                    )}
                    {(v.contacto || v.telefono) && (
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {v.contacto && (
                          <span className="flex items-center gap-1.5">
                            <UserRound aria-hidden="true" className="h-4 w-4 text-ink-600" />
                            {v.contacto}
                          </span>
                        )}
                        {v.telefono && (
                          <a href={`tel:${v.telefono}`} className="flex items-center gap-1.5 font-semibold text-brand-700">
                            <Phone aria-hidden="true" className="h-4 w-4" />
                            {v.telefono}
                          </a>
                        )}
                      </p>
                    )}
                    {v.observaciones && <p className="whitespace-pre-line text-ink-700">{v.observaciones}</p>}
                    {!v.tieneUbicacion && <p className="text-xs font-medium text-warn-soft-text">Guardada sin ubicación</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 px-3 py-3 backdrop-blur">
            <div className="mx-auto max-w-lg">
              <Button
                variant="secondary"
                size="xl"
                fullWidth
                onClick={() => setConfirmarFin(true)}
                leftIcon={<Flag aria-hidden="true" className="h-5 w-5" />}
              >
                Finalizar día
              </Button>
            </div>
          </div>
        </>
      )}

      {formularioAbierto && (
        <FormularioVisita onCerrar={() => setFormularioAbierto(false)} onGuardar={guardarVisita} />
      )}

      <ConfirmDialog
        open={confirmarFin}
        title="¿Finalizar el día de visitas?"
        description={
          jornada
            ? `${jornada.ciudad}: ${jornada.visitas.length} ${jornada.visitas.length === 1 ? "visita registrada" : "visitas registradas"}. Se guarda la hora de salida y tu ubicación.`
            : undefined
        }
        confirmLabel="Sí, finalizar"
        cancelLabel="Seguir visitando"
        size="xl"
        loading={ocupado}
        onConfirm={() => void finalizarDia()}
        onCancel={() => setConfirmarFin(false)}
      />
    </div>
  );
}
