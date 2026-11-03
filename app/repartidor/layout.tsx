"use client";

import { signOut, useSession } from "next-auth/react";
import IconButton from "@/components/ui/IconButton";
import { LogOut } from "@/components/ui/icons";
import { MarcaPJ } from "@/components/ui/Logo";

export default function RepartidorLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-espresso px-4 py-2 text-white shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <MarcaPJ size={44} />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold leading-tight">
              {session?.user?.name || "Repartidor"}
            </p>
            <p className="text-xs leading-tight text-ink-300">Mis entregas</p>
          </div>
        </div>
        <IconButton
          variant="inverse"
          size="lg"
          aria-label="Cerrar sesión"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="-mr-2"
        >
          <LogOut aria-hidden="true" className="h-6 w-6" />
        </IconButton>
      </header>
      <main className="mx-auto max-w-lg px-3 py-4 pb-10">{children}</main>
    </div>
  );
}
