import { Suspense } from "react";
import AuthCard from "@/components/ui/AuthCard";
import LoginForm from "./LoginForm";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <AuthCard
      etiqueta="Panel administrativo"
      title="Iniciar sesión"
      subtitle="Ingresa tus credenciales para continuar."
      footer={`© ${new Date().getFullYear()} Productos Jalil. Acceso restringido a personal autorizado.`}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
