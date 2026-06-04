// src/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  providers: [
    Credentials({
      credentials: {
        email:      { label: "Email",    type: "email"    },
        password:   { label: "Password", type: "password" },
        rememberMe: { label: "Remember", type: "text"     },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase() },
        });

        if (!user || user.deletedAt) return null;

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) return null;

        return {
          id:          user.id,
          email:       user.email,
          name:        user.displayName,
          rememberMe:  credentials.rememberMe === "true",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.displayName = user.name;
        token.rememberMe  = (user as any).rememberMe ?? false;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id          = token.id as string;
        session.user.displayName = token.displayName as string;
      }
      return session;
    },
  },

  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure:   process.env.NODE_ENV === "production",
      },
    },
  },
});
