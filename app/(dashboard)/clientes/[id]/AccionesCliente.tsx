"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalCliente from "../ModalCliente";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Gift, Pencil, RotateCcw, Trash2 } from "@/components/ui/icons";
import { useConfirmar } from "@/components/ui/useConfirmar";
interface Props {
  cliente: {
    id: string;
    nombre: string;
    razon_social: string | null;
    nit: string | null;
    telefono: string;
    direccion: string | null;
    latitud: number | null;
    longitud: number | null;
    codigo_mekano: string | null;
    ruta_id: string | null;
    activo: boolean;
    notas: string | null;
  };
  rutas: { id: string; nombre: string }[];
  puedeEliminar: boolean;
}

export default function AccionesCliente({ cliente, rutas, puedeEliminar }: Props) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const { confirmar, dialogo } = useConfirmar();

  async function alternarEstado() {
    const accion = cliente.activo ? "archivar" : "reactivar";
    const confirmado = await confirmar(
      cliente.activo
        ? {
            title: `¿Archivar a ${cliente.nombre}?`,
            description: "Dejará de aparecer como cliente activo, pero conserva su historial de pedidos.",
            confirmLabel: "Archivar",
            tone: "danger",
          }
        : { title: `¿Reactivar a ${cliente.nombre}?`, confirmLabel: "Reactivar" }
    );
    if (!confirmado) return;

    setErrorAccion("");
    setProcesando(true);
    try {
      const respuesta = cliente.activo
        ? await fetch(`/api/clientes/${cliente.id}`, { method: "DELETE" })
        : await fetch(`/api/clientes/${cliente.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activo: true }),
          });

      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.error ?? `No se pudo ${accion} el cliente`);
      }
      router.refresh();
    } catch (error) {
      setErrorAccion(error instanceof Error ? error.message : `Error al ${accion} el cliente`);
    } finally {
      setProcesando(false);
    }
  }

  async function eliminarPermanente() {
    const confirmado = await confirmar({
      title: `¿Eliminar definitivamente a ${cliente.nombre}?`,
      description:
        "Esto borra el cliente, sus contactos, sedes y precios personalizados sin dejar historial. No se puede deshacer.",
      confirmLabel: "Eliminar definitivamente",
      tone: "danger",
    });
    if (!confirmado) return;

    setErrorAccion("");
    setProcesando(true);
    try {
      const respuesta = await fetch(`/api/clientes/${cliente.id}?permanente=true`, {
        method: "DELETE",
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.error ?? "No se pudo eliminar el cliente");
      }
      router.push("/clientes");
      router.refresh();
    } catch (error) {
      setErrorAccion(error instanceof Error ? error.message : "Error al eliminar el cliente");
      setProcesando(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => setModalAbierto(true)}
          leftIcon={<Pencil aria-hidden="true" className="h-4 w-4" />}
        >
          Editar cliente
        </Button>
        <Button
          variant="secondary"
          onClick={alternarEstado}
          disabled={procesando}
          className={cliente.activo ? "border-danger/40 text-danger hover:bg-danger-soft" : "border-ok/40 text-ok hover:bg-ok-soft"}
          leftIcon={
            cliente.activo ? (
              <Gift aria-hidden="true" className="h-4 w-4" />
            ) : (
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
            )
          }
        >
          {cliente.activo
            ? procesando ? "Archivando..." : "Archivar cliente"
            : procesando ? "Reactivando..." : "Reactivar cliente"}
        </Button>
        {puedeEliminar && (
          <Button
            variant="secondary"
            onClick={eliminarPermanente}
            disabled={procesando}
            title="No tiene pedidos ni PQRs registrados, así que se puede eliminar sin dejar historial"
            className="border-danger/40 text-danger hover:bg-danger-soft"
            leftIcon={<Trash2 aria-hidden="true" className="h-4 w-4" />}
          >
            Eliminar cliente
          </Button>
        )}
      </div>
      {errorAccion && (
        <Alert tone="error" className="mt-3">
          {errorAccion}
        </Alert>
      )}
      {modalAbierto && (
        <ModalCliente
          rutas={rutas}
          clienteInicial={cliente}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
      {dialogo}
    </>
  );
}
