import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/arjun";
import { usuarios } from "@/db/arjun/schema";

declare module "next-auth" {
  interface User {
    rol?: string;
  }
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      rol?: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const username = (credentials.username as string).toLowerCase().trim();
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.username, username))
          .limit(1);

        if (!user || !user.activo) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.nombre,
          username: user.username,
          rol: user.rol,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        (token as any).rol = user.rol;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).rol = (token as any).rol ?? null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
