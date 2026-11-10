"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Input } from "@/components/ui/campos";
import { Clock } from "@/components/ui/icons";
import {
  HORA_MAXIMA,
  HORA_MINIMA,
  HORAS_ESPERA_MAX,
  horaLegible,
  validarHorarioMensajes,
} from "@/lib/mensajes-programados";

interface Props {
  config: {
    hora_recordatorio: string;
    horas_espera_followup: number;
  };
  onGuardado: (msg: string) => void;
}

export default function SeccionWhatsApp({ config, onGuardado }: Props) {
  const router = useRouter();
  const [hora, setHora] = useState(config.hora_recordatorio);
  const [horasEspera, setHorasEspera] = useState(config.horas_espera_followup.toString());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const horario = validarHorarioMensajes(hora, Number(horasEspera));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!horario.ok) {
      setError(horario.error);
      return;
    }
    setCargando(true);
    try {
      const res = await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hora_recordatorio: `1970-01-01T${hora}:00.000Z`,
          horas_espera_followup: Number(horasEspera),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      } else {
        onGuardado("Horario de mensajes actualizado");
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-3xl rounded-card border border-ink-200 bg-white p-4 shadow-card sm:p-6">
      <h2 className="mb-1 text-lg font-semibold text-ink-900">Mensajes automáticos de WhatsApp</h2>
      <p className="mb-6 text-sm text-ink-600">
        A los clientes cuya ruta sale al día siguiente y que todavía no han hecho su pedido se les envía
        un recordatorio y, si siguen sin pedir, un mensaje de seguimiento.
      </p>

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Hora del recordatorio"
            hint={`Entre las ${horaLegible(HORA_MINIMA)} y las ${horaLegible(HORA_MAXIMA)}`}
          >
            {(p) => (
              <Input
                {...p}
                type="time"
                step={900}
                min={HORA_MINIMA}
                max={HORA_MAXIMA}
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
              />
            )}
          </Field>
          <Field label="Horas de espera antes del seguimiento" hint={`De 1 a ${HORAS_ESPERA_MAX} horas`}>
            {(p) => (
              <Input
                {...p}
                type="number"
                inputMode="numeric"
                min={1}
                max={HORAS_ESPERA_MAX}
                step={1}
                value={horasEspera}
                onChange={(e) => setHorasEspera(e.target.value)}
                required
              />
            )}
          </Field>
        </div>

        {horario.ok ? (
          <div className="flex items-start gap-3 rounded-control border border-ink-200 bg-ink-50 p-4 text-sm text-ink-800">
            <Clock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="space-y-1">
              <p>
                <strong>Recordatorio:</strong> todos los días a las {horaLegible(horario.horaRecordatorio)}.
              </p>
              <p>
                <strong>Seguimiento:</strong> a las {horaLegible(horario.horaSeguimiento)}, solo a quienes
                aún no han pedido.
              </p>
            </div>
          </div>
        ) : (
          <Alert tone="warning">{horario.error}</Alert>
        )}

        <Alert tone="info">
          El texto de los mensajes lo fijan las plantillas aprobadas por Meta (recordatorio_pedido y
          seguimiento_pedido). Para cambiar el texto hay que crear y aprobar una plantilla nueva. Si
          cambias la hora el mismo día, el mensaje puede volver a salir hoy a la nueva hora.
        </Alert>

        <div className="pt-2">
          <Button type="submit" loading={cargando} disabled={!horario.ok}>
            Guardar horario
          </Button>
        </div>
      </form>
    </div>
  );
}
