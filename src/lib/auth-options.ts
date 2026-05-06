import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/giris",
    error:  "/giris",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "E-posta", type: "email"    },
        password: { label: "Şifre",   type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { business: true },
        });

        if (!user) return null;

        const sifreDogruMu = await bcrypt.compare(credentials.password, user.password);
        if (!sifreDogruMu) return null;

        return {
          id:         user.id,
          email:      user.email,
          name:       `${user.ad} ${user.soyad ?? ""}`.trim(),
          businessId: user.businessId ?? undefined,
          businessAd: user.business?.ad ?? undefined,
          role:       user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id         = user.id;
        token.businessId = (user as any).businessId;
        token.businessAd = (user as any).businessAd;
        token.role       = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id         = token.id;
        (session.user as any).businessId = token.businessId;
        (session.user as any).businessAd = token.businessAd;
        (session.user as any).role       = token.role;
      }
      return session;
    },
  },
};
