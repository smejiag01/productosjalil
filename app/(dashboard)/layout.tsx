import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pt-[72px] px-4 pb-6 lg:pt-8 lg:pb-8 lg:px-8 lg:ml-[240px]">
        {children}
      </main>
    </div>
  );
}
