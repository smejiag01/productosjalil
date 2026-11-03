import Sidebar from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contactosPendientes = await prisma.contactos_pendientes.count({
    where: { atendido: false },
  });

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar contactosPendientes={contactosPendientes} />
      <main className="px-4 pb-8 pt-[72px] lg:ml-[240px] lg:px-8 lg:pb-10 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
