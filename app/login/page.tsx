import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#1E1E2D] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4">
          PJ
        </div>
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
