import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        correo: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.correo || !credentials?.password) {
          throw new Error("Correo y contraseña son requeridos");
        }

        const usuario = await prisma.usuarios.findUnique({
          where: { correo: credentials.correo },
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
