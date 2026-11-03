"use client";

import { useState, type ReactNode } from "react";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Field from "@/components/ui/Field";
import IconButton from "@/components/ui/IconButton";
import Logo from "@/components/ui/Logo";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import ProductImage from "@/components/ui/ProductImage";
import QtyStepper from "@/components/ui/QtyStepper";
import SearchInput from "@/components/ui/SearchInput";
import Sheet from "@/components/ui/Sheet";
import Skeleton from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/campos";
import { ShoppingCart, Trash2, Truck } from "@/components/ui/icons";
import { ESTADOS } from "@/lib/pedidos";
import { acento, marca, semantica, superficies, tinta } from "@/lib/design/tokens";

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-ink-200 pb-2 font-display text-xl font-semibold text-ink-900">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Muestra({ nombre, hex }: { nombre: string; hex: string }) {
  return (
    <div className="w-28">
      <div className="h-14 rounded-control border border-ink-200" style={{ background: hex }} />
      <p className="mt-1 text-xs font-semibold text-ink-900">{nombre}</p>
      <p className="text-xs text-ink-600">{hex}</p>
    </div>
  );
}

export default function UiKitDemo() {
  const [modal, setModal] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [hoja, setHoja] = useState(false);
  const [cant, setCant] = useState(2);
  const [busqueda, setBusqueda] = useState("");
  const [chip, setChip] = useState("todos");

  const paleta: [string, string][] = [
    ["brand-600", marca[600]],
    ["brand-700", marca[700]],
    ["brand-800", marca[800]],
    ["brand-50", marca[50]],
    ["ink-900", tinta[900]],
    ["ink-600", tinta[600]],
    ["ink-500", tinta[500]],
    ["ink-300", tinta[300]],
    ["ink-200", tinta[200]],
    ["ink-100", tinta[100]],
    ["paper", superficies.papel],
    ["espresso", superficies.espresso],
    ["accent", acento],
    ["ok", semantica.ok],
    ["info", semantica.info],
    ["danger", semantica.peligro],
    ["warn", semantica.advertencia],
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-12 px-4 py-10">
      <PageHeader
        title="Kit de interfaz"
        subtitle="Galería de componentes del nuevo sistema de diseño (solo desarrollo)."
        count="v1"
        actions={<Button leftIcon={<ShoppingCart className="h-4 w-4" />}>Acción</Button>}
      />

      <Seccion titulo="Marca">
        <div className="flex flex-wrap items-center gap-8 rounded-card bg-white p-6 shadow-card">
          <Logo variant="lockup" size={48} />
          <Logo variant="stacked" size={56} />
          <Logo variant="mark" size={56} />
          <div className="flex gap-3 rounded-card bg-espresso p-4">
            <Logo variant="lockup" tone="cream" size={44} />
          </div>
          <Logo variant="mark" tone="ink" size={40} />
        </div>
      </Seccion>

      <Seccion titulo="Paleta">
        <div className="flex flex-wrap gap-4">
          {paleta.map(([n, h]) => (
            <Muestra key={n} nombre={n} hex={h} />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Tipografía">
        <div className="space-y-2 rounded-card bg-white p-6 shadow-card">
          <p className="font-display text-4xl font-semibold text-ink-900">Tradición artesanal</p>
          <p className="font-display text-2xl font-semibold text-brand">$1.250.000</p>
          <p className="text-base text-ink-800">
            Public Sans: texto de lectura, tablas y formularios. Áéíóú ñ ¿? ¡! 0123456789
          </p>
          <p className="text-sm tabular-nums text-ink-600">Números tabulares: 1.111 — 8.888</p>
        </div>
      </Seccion>

      <Seccion titulo="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="danger">Peligro</Button>
          <Button variant="accent">Acento</Button>
          <Button variant="success">Éxito</Button>
          <Button loading>Guardando</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Pequeño</Button>
          <Button size="md">Mediano</Button>
          <Button size="lg">Grande</Button>
          <Button size="xl" leftIcon={<Truck className="h-5 w-5" />}>
            Extra grande (56 px)
          </Button>
          <IconButton aria-label="Eliminar">
            <Trash2 aria-hidden="true" className="h-5 w-5" />
          </IconButton>
          <Button href="/" variant="secondary">
            Enlace
          </Button>
        </div>
      </Seccion>

      <Seccion titulo="Formularios">
        <Card className="grid gap-4 sm:grid-cols-2">
          <Field label="NIT o documento" hint="Escríbelo sin puntos" required>
            {(p) => <Input {...p} placeholder="Ej: 900123456" />}
          </Field>
          <Field label="Correo" error="Ingresa un correo válido">
            {(p) => <Input {...p} defaultValue="correo@" />}
          </Field>
          <Field label="Ruta">
            {(p) => (
              <Select {...p}>
                <option>Pereira</option>
                <option>Cartago</option>
              </Select>
            )}
          </Field>
          <Field label="Notas">{(p) => <Textarea {...p} placeholder="Opcional" />}</Field>
          <SearchInput label="Buscar" value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
          <Checkbox label="Cliente activo" defaultChecked />
        </Card>
      </Seccion>

      <Seccion titulo="Chips, insignias y avisos">
        <div className="flex flex-wrap gap-2">
          {["todos", "pendientes", "entregados"].map((c, i) => (
            <Chip key={c} selected={chip === c} count={[12, 4, 8][i]} onClick={() => setChip(c)}>
              {c[0].toUpperCase() + c.slice(1)}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(ESTADOS).map((e) => (
            <StatusBadge key={e} estado={e} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(ESTADOS).map((e) => (
            <StatusBadge key={e} estado={e} variant="solid" size="lg" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand" dot>Marca</Badge>
          <Badge tone="ok" variant="solid">Activo</Badge>
          <Badge tone="warn">Sin ruta</Badge>
          <Badge tone="danger" variant="solid">Inactivo</Badge>
          <Badge tone="accent">Nuevo</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Alert tone="error" title="No se pudo guardar">Revisa los datos e inténtalo de nuevo.</Alert>
          <Alert tone="warning">Hay 5 clientes sin ruta asignada.</Alert>
          <Alert tone="success">Pedido confirmado.</Alert>
          <Alert tone="info">Las entregas salen martes y viernes.</Alert>
        </div>
      </Seccion>

      <Seccion titulo="Tarjetas, cantidad, imágenes">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Ventas de hoy" value="$1.234.500" hint="total facturado" tone="brand" />
          <StatCard label="Clientes sin ruta" value="5" hint="no pueden pedir" tone="warn" />
          <StatCard label="Pedidos de hoy" value="12" tone="ok" />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <QtyStepper value={cant} label="Tocineta Premium" onIncrement={() => setCant((v) => v + 1)} onDecrement={() => setCant((v) => Math.max(0, v - 1))} />
          <ProductImage src={null} alt="Sin foto" className="aspect-[4/3] w-48 rounded-card" />
          <Skeleton className="h-24 w-48" />
        </div>
      </Seccion>

      <Seccion titulo="Tabla y estado vacío">
        <Table>
          <thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Ruta</Th>
              <Th align="right">Total</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            <Tr>
              <Td className="font-medium text-ink-900">Salsamentaria Express</Td>
              <Td>Armenia</Td>
              <Td numeric>$217.000</Td>
              <Td><StatusBadge estado="en_reparto" /></Td>
            </Tr>
            <Tr>
              <Td className="font-medium text-ink-900">Sebastián Mejia</Td>
              <Td>Pereira</Td>
              <Td numeric>$88.000</Td>
              <Td><StatusBadge estado="entregado" /></Td>
            </Tr>
          </tbody>
        </Table>
        <Card padding="none">
          <EmptyState
            icon={<ShoppingCart className="h-6 w-6" />}
            title="Tu carrito está vacío"
            description="Agrega productos desde el catálogo para armar tu pedido."
            action={<Button>Ver productos</Button>}
          />
        </Card>
      </Seccion>

      <Seccion titulo="Diálogos">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModal(true)}>Abrir modal</Button>
          <Button variant="secondary" onClick={() => setConfirmar(true)}>Confirmar entrega</Button>
          <Button variant="secondary" onClick={() => setHoja(true)}>Abrir hoja inferior</Button>
        </div>
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Editar cliente"
          description="Cambia los datos y guarda."
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
              <Button onClick={() => setModal(false)}>Guardar</Button>
            </>
          }
        >
          <Field label="Nombre">{(p) => <Input {...p} defaultValue="Salsamentaria Express" />}</Field>
        </Modal>
        <ConfirmDialog
          open={confirmar}
          title="¿Confirmas la entrega?"
          description="Salsamentaria Express · CRA 7 12 39 · $217.000"
          confirmLabel="Confirmar entrega"
          tone="success"
          size="xl"
          onConfirm={() => setConfirmar(false)}
          onCancel={() => setConfirmar(false)}
        />
        <Sheet open={hoja} onClose={() => setHoja(false)} label="Resumen del carrito" className="bg-white p-5">
          <p className="font-display text-lg font-semibold">Hoja inferior</p>
          <p className="mt-1 text-sm text-ink-700">Útil para el carrito y para acciones en móvil.</p>
          <Button className="mt-4" fullWidth onClick={() => setHoja(false)}>Cerrar</Button>
        </Sheet>
      </Seccion>
    </main>
  );
}
