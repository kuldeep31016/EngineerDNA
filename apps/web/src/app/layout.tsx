import type { Metadata } from "next";
import { APP_NAME } from "@engineerdna/shared";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AppChrome } from "@/components/app/AppChrome";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: `${APP_NAME} — The Trust Layer for Technical Hiring`,
  description:
    "EngineerDNA analyzes real engineering evidence from GitHub to build a verified developer profile. Evidence over claims.",
  openGraph: {
    siteName: APP_NAME,
    type: "website",
    title: `${APP_NAME} — The Trust Layer for Technical Hiring`,
    description: "Hire engineers on verified engineering evidence, not resume claims.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {/* React hoists these global stylesheet links into <head>. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
        </AuthProvider>
      </body>
    </html>
  );
}
