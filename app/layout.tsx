import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "FishCast România",
  description: "Locuri de pescuit, vreme și condiții analizate pentru pescari.",
  manifest: "/manifest.webmanifest",
  icons: { apple: "/icons/icon-192.png" }
};

export const viewport: Viewport = {
  themeColor: "#0b3d2e",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
