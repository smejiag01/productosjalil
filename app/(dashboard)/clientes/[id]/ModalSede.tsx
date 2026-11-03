"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import UbicacionMapa from "@/components/UbicacionMapa";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/campos";

interface Props {
  clienteId: string;
  sedeInicial?: {
    id: string;
    nombre_sede: string;
    direccion: string | null;
    latitud: number | null;
    longitud: number | null;
    es_principal: boolean;
    activa: boolean;
  } | null;
  onCerrar: () => void;
}

export default function ModalSede({ clienteId, sedeInicial, onCerrar }: Props) {
  const router = useRouter();
  const esEdicion = !!sedeInicial;

  const [nombreSede, setNombreSede] = useState(sedeInicial?.nombre_sede ?? "");
  const [direccion, setDireccion] = useState(sedeInicial?.direccion ?? "");
  const [latitud, setLatitud] = useState<number | null>(sedeInicial?.latitud ?? null);
  const [longitud, setLongitud] = useState<number | null>(sedeInicial?.longitud ?? null);
  const [esPrincipal, setEsPrincipal] = useState(sedeInicial?.es_principal ?? false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral("");
    setCargando(true);

    const body = {
      nombre_sede: nombreSede,
      direccion: direccion || null,
      latitud,
      longitud,
      es_principal: esPrincipal,
    };

    try {
      const url = esEdicion ? `/api/sedes/${sedeInicial!.id}` : `/api/clientes/${clienteId}/sedes`;
      const method = esEdicion ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.success) {
        setErrorGeneral(data.error || "Error al guardar");
        setCargando(false);
        return;
      }

      router.refresh();
      onCerrar();
    } catch {
      setErrorGeneral("Error de conexión. Intenta de nuevo.");
      setCargando(false);
    }
  }

  const idFormulario = "formulario-sede";

  return (
    <Modal
      open
      onClose={onCerrar}
      title={esEdicion ? "Editar sede" : "Nueva sede"}
      size="md"
      dismissible={!cargando}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button type="submit" form={idFormulario} loading={cargando}>
            {esEdicion ? "Guardar cambios" : "Crear sede"}
          </Button>
        </>
      }
    >
      <form id={idFormulario} onSubmit={handleSubmit} className="space-y-4">
        {errorGeneral && <Alert tone="error">{errorGeneral}</Alert>}

        <Field label="Nombre de la sede" required>
          {(p) => (
            <Input
              {...p}
              type="text"
              value={nombreSede}
              onChange={(e) => setNombreSede(e.target.value)}
              required
              placeholder="Ej: Principal, Sucursal Norte..."
            />
          )}
        </Field>

        <UbicacionMapa
          direccion={direccion}
          onDireccion={setDireccion}
          latitud={latitud}
          longitud={longitud}
          onUbicacion={(c) => {
            setLatitud(c?.lat ?? null);
            setLongitud(c?.lng ?? null);
          }}
          placeholder="Dirección de entrega de esta sede"
        />

        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink-800">
          <input
            type="checkbox"
            checked={esPrincipal}
            onChange={(e) => setEsPrincipal(e.target.checked)}
            className="h-5 w-5 rounded border-ink-300 text-brand-600 focus:ring-brand/30"
          />
          Sede principal
        </label>
      </form>
    </Modal>
  );
}
