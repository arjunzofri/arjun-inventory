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
      rol?: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.email, email))
          .limit(1);

        if (!user || !user.activo) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.nombre,
          email: user.email,
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
      if (user?.rol) {
        (token as any).rol = user.rol;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).rol = (token as any).rol ?? null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
