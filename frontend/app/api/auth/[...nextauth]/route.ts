/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, user is passed. Safely bind user.id to token.
      if (user) {
        token.sub = user.id;
        (token as any).id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Safely map token.sub to session.user.id without throwing on undefined
      if (session?.user) {
        const userId = token?.sub || (token as any)?.id;
        if (userId) {
          (session.user as any).id = userId;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs (e.g. "/studio")
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin or localhost dev ports
      try {
        const parsedUrl = new URL(url);
        const parsedBase = new URL(baseUrl);
        if (
          parsedUrl.origin === parsedBase.origin ||
          (parsedUrl.hostname === "localhost" && parsedBase.hostname === "localhost") ||
          (parsedUrl.hostname === "127.0.0.1" && parsedBase.hostname === "127.0.0.1")
        ) {
          return url;
        }
      } catch {
        // Invalid URL fallback
      }
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
