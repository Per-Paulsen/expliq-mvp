import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isAuthPage = pathname === "/login" || pathname === "/signup";

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", request.nextUrl));
      }

      if (isAuthPage) return true;

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
