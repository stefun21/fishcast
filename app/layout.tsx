import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FishCast România",
  description: "Platformă pentru pescarii din România."
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
