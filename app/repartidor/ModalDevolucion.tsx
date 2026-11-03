"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/campos";

interface Props {
  cargando: boolean;
  onConfirmar: (motivo: string) => void;
  onCerrar: () => void;
}

export default function ModalDevolucion({ cargando, onConfirmar, onCerrar }: Props) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  function handleConfirmar() {
    if (!motivo.trim()) {
      setError("Escribe el motivo de la devolución");
      return;
    }
    setError("");
    onConfirmar(motivo.trim());
  }

  return (
    <Modal
      open
      onClose={onCerrar}
      title="Registrar devolución"
      description="Queda guardado el motivo para que la oficina lo vea."
      size="md"
      dismissible={!cargando}
      footer={
        <>
          <Button variant="secondary" size="xl" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button variant="danger" size="xl" onClick={handleConfirmar} loading={cargando}>
            Confirmar devolución
          </Button>
        </>
      }
    >
      <Field label="Motivo de la devolución" required error={error}>
        {(p) => (
          <Textarea
            {...p}
            data-autofocus
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={4}
            invalid={!!error}
            placeholder="Ej: Cliente no se encontraba, producto rechazado, dirección incorrecta..."
          />
        )}
      </Field>
    </Modal>
  );
}
