// src/app/layout.tsx
import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets:  ["latin"],
  weight:   ["400", "500", "600", "700"],
  variable: "--font-body",
  display:  "swap",
});

export const metadata: Metadata = {
  title:       "CBT Simulator",
  description: "Practice MCQ simulator for your professional examination",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={ibmPlexSans.variable}>
      <body className="font-body antialiased bg-canvas text-body">
        {children}
      </body>
    </html>
  );
}
