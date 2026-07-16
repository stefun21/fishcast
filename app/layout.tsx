import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FishCast România",
  description: "Descoperă cele mai bune locuri de pescuit din România.",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}