import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppVendedor from "./AppVendedor";

export const dynamic = "force-dynamic";

export const metadata = { title: "Informe de visitas" };

export default async function VendedorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== "vendedor") {
    redirect("/");
  }
  return <AppVendedor usuarioId={session.user.id} />;
}
