import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { MarcaPJ } from "@/components/ui/Logo";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#1E1E2D] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <MarcaPJ size={112} title="Productos Jalil" className="mb-3" />
        <h1 className="text-white text-xl font-semibold">Productos Jalil</h1>
        <p className="text-gray-400 text-sm">
          CARNICERÍA · PANEL ADMINISTRATIVO
        </p>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>

      {/* Footer */}
      <p className="mt-8 text-gray-500 text-xs text-center">
        &copy; {new Date().getFullYear()} Productos Jalil. Acceso restringido a
        personal autorizado.
      </p>
    </div>
  );
}
