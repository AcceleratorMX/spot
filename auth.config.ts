import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { Role } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        return null; // Will be implemented in auth.ts
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.email) token.email = session.user.email;
        if (session.user.role) token.role = session.user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.name = token.name;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
