import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|icon|apple-icon|manifest|robots|sitemap).*)",
  ],
};
