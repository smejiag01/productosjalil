"use client";

import { signOut, useSession } from "next-auth/react";

export default function RepartidorLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-sidebar text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
            PJ
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {session?.user?.name || "Repartidor"}
            </p>
            <p className="text-gray-400 text-xs leading-tight">Mis entregas</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 -mr-2 text-gray-300 hover:text-white transition-colors flex-shrink-0"
          aria-label="Cerrar sesión"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </header>
      <main className="max-w-lg mx-auto px-3 py-4 pb-10">{children}</main>
    </div>
  );
}
