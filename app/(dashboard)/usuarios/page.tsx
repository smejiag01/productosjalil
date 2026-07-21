import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import TablaUsuarios from "./TablaUsuarios";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const [usuarios, session] = await Promise.all([
    prisma.usuarios.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        activo: true,
      },
      orderBy: { nombre: "asc" },
    }),
    getServerSession(authOptions),
  ]);

  return <TablaUsuarios usuarios={usuarios} usuarioActualId={session?.user?.id ?? ""} />;
}
