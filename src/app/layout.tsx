import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/session-provider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://expliq-mvp.vercel.app"),
  title: "Expliq — Automation Intelligence",
  description:
    "See what's working, what's broken, and what to build next. Governance dashboard for no/low-code automation stacks.",
  openGraph: {
    title: "Expliq — Automation Intelligence",
    description:
      "See what's working, what's broken, and what to build next. Governance dashboard for no/low-code automation stacks.",
    url: "https://expliq-mvp.vercel.app",
    siteName: "Expliq",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Expliq — Automation Intelligence",
    description:
      "See what's working, what's broken, and what to build next.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased overflow-x-hidden bg-background">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
