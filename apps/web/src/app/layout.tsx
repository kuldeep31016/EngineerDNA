import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE } from "@engineerdna/shared";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    "EngineerDNA verifies engineering capability using evidence instead of resume claims.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
