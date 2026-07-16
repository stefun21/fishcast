import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FishCast România",
    template: "%s · FishCast România",
  },
  description:
    "Descoperă locuri de pescuit, verifică vremea și alege momentul potrivit pentru următoarea partidă.",
  applicationName: "FishCast România",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06130f",
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
