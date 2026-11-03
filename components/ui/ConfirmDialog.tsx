"use client";

import type { ReactNode } from "react";
import Button from "./Button";
import Modal from "./Modal";
import type { TamanoBoton } from "./clases";

/**
 * Confirmación estilizada: reemplaza a `window.confirm()`. Con `size="xl"` los
 * botones miden 56 px (pensado para el repartidor, con una mano y al sol).
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "primary",
  loading,
  size = "md",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger" | "success";
  loading?: boolean;
  size?: TamanoBoton;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" size={size} onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone} size={size} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
