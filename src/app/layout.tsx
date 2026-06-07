// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import SentryProvider from "@/components/SentryProvider";
import PostHogProvider from "@/components/PostHogProvider";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1A73E8",
};

export const metadata: Metadata = {
  title: "CBT Simulator",
  description: "Practice MCQ simulator for your professional examination",
  manifest: "/manifest.json",
  // themeColor removed from here — moved to viewport above
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CBT Simulator",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={ibmPlexSans.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-body antialiased bg-canvas text-body">
        <SessionProvider>
          <SentryProvider>
            <PostHogProvider>{children}</PostHogProvider>
          </SentryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
