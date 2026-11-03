/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Pagina = (props: any) => Promise<React.ReactNode> | React.ReactNode;

// Vista previa de pantallas del panel admin sin iniciar sesión (solo lectura, solo desarrollo).
async function resolver(seccion: string): Promise<React.ReactNode> {
  const sinParametros = { searchParams: Promise.resolve({}), params: Promise.resolve({}) };
  switch (seccion) {
    case "pedidos": {
      const Pagina = (await import("@/app/(dashboard)/pedidos/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "clientes": {
      const Pagina = (await import("@/app/(dashboard)/clientes/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "productos": {
      const Pagina = (await import("@/app/(dashboard)/productos/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "inventarios": {
      const Pagina = (await import("@/app/(dashboard)/inventarios/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "cliente": {
      const primero = await prisma.clientes.findFirst({ select: { id: true } });
      if (!primero) return <p>No hay clientes.</p>;
      const Pagina = (await import("@/app/(dashboard)/clientes/[id]/page")).default as Pagina;
      return Pagina({ ...sinParametros, params: Promise.resolve({ id: primero.id }) });
    }
    case "pedido": {
      const primero = await prisma.pedidos.findFirst({ select: { id: true } });
      if (!primero) return <p>No hay pedidos.</p>;
      const Pagina = (await import("@/app/(dashboard)/pedidos/[id]/page")).default as Pagina;
      return Pagina({ ...sinParametros, params: Promise.resolve({ id: primero.id }) });
    }
    case "categorias": {
      const Pagina = (await import("@/app/(dashboard)/categorias/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "contactos-pendientes": {
      const Pagina = (await import("@/app/(dashboard)/contactos-pendientes/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "usuarios": {
      const Pagina = (await import("@/app/(dashboard)/usuarios/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "rutas": {
      const Pagina = (await import("@/app/(dashboard)/rutas/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "repartidores": {
      const Pagina = (await import("@/app/(dashboard)/repartidores/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "pqrs": {
      const Pagina = (await import("@/app/(dashboard)/pqrs/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "configuracion": {
      const Pagina = (await import("@/app/(dashboard)/configuracion/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "empleados": {
      const Pagina = (await import("@/app/(dashboard)/empleados/page")).default as Pagina;
      return Pagina(sinParametros);
    }
    case "ruta": {
      const primero = await prisma.rutas.findFirst({ select: { id: true } });
      if (!primero) return <p>No hay rutas.</p>;
      const Pagina = (await import("@/app/(dashboard)/rutas/[id]/page")).default as Pagina;
      return Pagina({ ...sinParametros, params: Promise.resolve({ id: primero.id }) });
    }
    case "pqr": {
      const primero = await prisma.pqr.findFirst({ select: { id: true } });
      if (!primero) return <p>No hay PQRs.</p>;
      const Pagina = (await import("@/app/(dashboard)/pqrs/[id]/page")).default as Pagina;
      return Pagina({ ...sinParametros, params: Promise.resolve({ id: primero.id }) });
    }
    default:
      return null;
  }
}

export default async function AdminSeccionDemo(props: { params: Promise<{ seccion: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { seccion } = await props.params;
  const contenido = await resolver(seccion);
  if (contenido === null) notFound();
  return (
    <div className="min-h-screen bg-paper">
      <Sidebar contactosPendientes={3} />
      <main className="px-4 pb-8 pt-[72px] lg:ml-[240px] lg:px-8 lg:pb-10 lg:pt-8">{contenido}</main>
    </div>
  );
}
