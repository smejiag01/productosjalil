import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import HomePage from "@/app/(dashboard)/page";

export const dynamic = "force-dynamic";

// Vista previa del panel admin (menú + Inicio) sin iniciar sesión. Solo desarrollo.
export default function AdminDemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-paper">
      <Sidebar contactosPendientes={3} />
      <main className="px-4 pb-8 pt-[72px] lg:ml-[240px] lg:px-8 lg:pb-10 lg:pt-8">
        <HomePage />
      </main>
    </div>
  );
}
