import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FishCast România — Unde merită să pescuiești azi",
    template: "%s · FishCast România",
  },
  description:
    "Descoperă locuri de pescuit din România, verifică vremea live, presiunea, vântul și Fishing Index-ul pentru fiecare locație.",
  applicationName: "FishCast România",
  category: "travel",
  keywords: [
    "pescuit România",
    "bălți pescuit",
    "vreme pescuit",
    "Fishing Index",
    "locuri de pescuit",
    "hartă pescuit",
  ],
  authors: [{ name: "FishCast România" }],
  creator: "FishCast România",
  publisher: "FishCast România",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: "FishCast România",
    title: "FishCast România",
    description:
      "Găsește locul potrivit, la momentul potrivit. Hartă, vreme live și Fishing Index.",
  },
  twitter: {
    card: "summary",
    title: "FishCast România",
    description:
      "Locuri de pescuit, vreme live și recomandări pentru următoarea partidă.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FishCast",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07111b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body>
        <ServiceWorkerRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
