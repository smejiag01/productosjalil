import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { identificarIngreso } from "./documento";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        usuario: { label: "Número de documento", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.usuario || !credentials?.password) {
          throw new Error("Documento y contraseña son requeridos");
        }

        // Se ingresa con el número de documento; un correo también sirve
        // mientras se completan los documentos de todos los usuarios.
        const ingreso = identificarIngreso(credentials.usuario);
        if (!ingreso) {
          throw new Error("Credenciales inválidas");
        }
        const usuario = await prisma.usuarios.findFirst({
          where:
            ingreso.tipo === "documento"
              ? { documento: ingreso.documento }
              : { correo: { equals: ingreso.correo, mode: "insensitive" } },
        });

        if (!usuario || !usuario.activo) {
          throw new Error("Credenciales inválidas");
        }

        const passwordValido = await compare(
          credentials.password,
          usuario.password_hash
        );

        if (!passwordValido) {
          throw new Error("Credenciales inválidas");
        }

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.correo,
          rol: usuario.rol,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as { rol: string }).rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { rol: string }).rol = token.rol as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
