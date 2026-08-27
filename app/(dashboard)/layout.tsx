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
    <div className="min-h-screen">
      <Sidebar contactosPendientes={contactosPendientes} />
      <main className="pt-[72px] px-4 pb-6 lg:pt-8 lg:pb-8 lg:px-8 lg:ml-[240px]">
        {children}
      </main>
    </div>
  );
}
