import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isPublic =
        path.startsWith("/login") ||
        path.startsWith("/register") ||
        path.startsWith("/invite/") ||
        path.startsWith("/g/") ||
        path.startsWith("/api/auth");

      if (isPublic) return true;
      if (!isLoggedIn) return false;
      if (isLoggedIn && (path.startsWith("/login") || path.startsWith("/register"))) {
        return Response.redirect(new URL("/", request.nextUrl));
      }
      return true;
    },
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
