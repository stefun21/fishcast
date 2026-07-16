import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FishCast România",
    short_name: "FishCast",
    description:
      "Descoperă locuri de pescuit, salvează favorite și verifică momentul potrivit pentru următoarea partidă.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#07111b",
    theme_color: "#26b7ed",
    lang: "ro",
    categories: ["sports", "travel", "navigation", "weather"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Vezi toate locațiile",
        short_name: "Vezi tot",
        description: "Deschide catalogul complet ordonat după distanță.",
        url: "/lakes",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Favorite",
        short_name: "Favorite",
        description: "Deschide bălțile salvate.",
        url: "/favorites",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
