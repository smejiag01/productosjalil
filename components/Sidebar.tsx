"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import IconButton from "@/components/ui/IconButton";
import Sheet from "@/components/ui/Sheet";
import { MarcaPJ } from "@/components/ui/Logo";
import {
  ChartColumn,
  IdCard,
  House,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquareWarning,
  Package,
  PhoneCall,
  Route,
  Settings,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";

interface ItemMenu {
  nombre: string;
  href: string;
  Icono: LucideIcon;
}

const INICIO: ItemMenu = { nombre: "Inicio", href: "/", Icono: House };

const GRUPOS: { titulo: string; items: ItemMenu[] }[] = [
  {
    titulo: "Operación",
    items: [
      { nombre: "Pedidos", href: "/pedidos", Icono: ShoppingBag },
      { nombre: "Rutas", href: "/rutas", Icono: Route },
      { nombre: "Repartidores", href: "/repartidores", Icono: Truck },
      { nombre: "Analíticas", href: "/analiticas", Icono: ChartColumn },
    ],
  },
  {
    titulo: "Catálogo",
    items: [
      { nombre: "Productos", href: "/productos", Icono: Tag },
      { nombre: "Categorías", href: "/categorias", Icono: LayoutGrid },
      { nombre: "Inventarios", href: "/inventarios", Icono: Package },
    ],
  },
  {
    titulo: "Clientes",
    items: [
      { nombre: "Clientes", href: "/clientes", Icono: Users },
      { nombre: "Visitas", href: "/visitas", Icono: Store },
      { nombre: "Por contactar", href: "/contactos-pendientes", Icono: PhoneCall },
      { nombre: "PQR's", href: "/pqrs", Icono: MessageSquareWarning },
    ],
  },
  {
    titulo: "Administración",
    items: [
      { nombre: "Empleados", href: "/empleados", Icono: IdCard },
      { nombre: "Usuarios", href: "/usuarios", Icono: UserRound },
      { nombre: "Configuración", href: "/configuracion", Icono: Settings },
    ],
  },
];

function estaActivo(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar({ contactosPendientes = 0 }: { contactosPendientes?: number }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [abierto, setAbierto] = useState(false);

  // Al navegar, el cajón se cierra solo
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  // Si se ensancha la ventana hasta escritorio, el cajón ya no tiene sentido
  useEffect(() => {
    const consulta = window.matchMedia("(min-width: 1024px)");
    const alCambiar = () => consulta.matches && setAbierto(false);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  const inicialNombre = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AD";

  function enlace(item: ItemMenu) {
    const activo = estaActivo(pathname, item.href);
    const insignia = item.href === "/contactos-pendientes" ? contactosPendientes : 0;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={activo ? "page" : undefined}
        className={cn(
          "relative flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors",
          activo
            ? "bg-espresso-active text-white"
            : "text-ink-200 hover:bg-espresso-hover hover:text-white"
        )}
      >
        {activo && (
          <span
            aria-hidden="true"
            className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-accent"
          />
        )}
        <item.Icono aria-hidden="true" className={cn("h-5 w-5 flex-shrink-0", activo && "text-accent")} />
        <span className="flex-1">{item.nombre}</span>
        {insignia > 0 && (
          <span
            aria-label={`${insignia} por contactar`}
            className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold text-white"
          >
            {insignia}
          </span>
        )}
      </Link>
    );
  }

  const contenido = (
    <>
      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        <MarcaPJ size={48} />
        <div className="min-w-0">
          <p className="font-display text-base font-semibold leading-tight text-white">
            Productos Jalil
          </p>
          <p className="text-xs text-ink-300">Panel administrativo</p>
        </div>
      </div>

      <nav aria-label="Principal" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-2 [scrollbar-color:#54413A_transparent] [scrollbar-width:thin]">
        <div>{enlace(INICIO)}</div>
        {GRUPOS.map((g) => (
          <div key={g.titulo}>
            <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-300">
              {g.titulo}
            </p>
            <div className="space-y-0.5">{g.items.map(enlace)}</div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 pb-4 pt-4">
        <div className="mb-2 flex items-center gap-3 px-3">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
          >
            {inicialNombre}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {session?.user?.name || "Administrador"}
            </p>
            <p className="truncate text-xs capitalize text-ink-300">
              {session?.user?.rol || "admin"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-sm font-medium text-ink-200 transition-colors hover:bg-espresso-hover hover:text-white"
        >
          <LogOut aria-hidden="true" className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Barra superior: tablet y celular */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 bg-espresso px-3 lg:hidden">
        <IconButton
          variant="inverse"
          aria-label="Abrir el menú"
          aria-expanded={abierto}
          onClick={() => setAbierto(true)}
        >
          <Menu aria-hidden="true" className="h-6 w-6" />
        </IconButton>
        <MarcaPJ size={36} />
        <span className="font-display text-base font-semibold text-white">Productos Jalil</span>
      </header>

      {/* Barra lateral fija: escritorio */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[240px] flex-col bg-espresso lg:flex">
        {contenido}
      </aside>

      {/* Cajón: tablet y celular (foco atrapado, Escape y fondo bloqueado) */}
      <Sheet open={abierto} onClose={() => setAbierto(false)} side="left" label="Menú principal" className="bg-espresso lg:hidden">
        <div className="absolute right-2 top-2 z-10">
          <IconButton variant="inverse" aria-label="Cerrar el menú" onClick={() => setAbierto(false)}>
            <X aria-hidden="true" className="h-6 w-6" />
          </IconButton>
        </div>
        {contenido}
      </Sheet>
    </>
  );
}
