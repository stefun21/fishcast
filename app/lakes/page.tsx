import type { Metadata } from "next";
import { AllLakesDirectory } from "@/components/lakes/all-lakes-directory";

export const metadata: Metadata = {
  title: "Toate locațiile de pescuit",
  description: "Catalogul complet FishCast, ordonat automat după distanța față de tine.",
};

export default async function AllLakesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialQuery = typeof params.q === "string" ? params.q : "";

  return (
    <main className="page-content directory-page">
      <section className="page-intro directory-intro">
        <p className="section-kicker">CATALOG NAȚIONAL</p>
        <h1>Toate locațiile, într-un singur loc.</h1>
        <p>
          Permite accesul la locație, iar FishCast ordonează automat catalogul de la cea mai apropiată apă la cea mai îndepărtată.
        </p>
      </section>
      <AllLakesDirectory initialQuery={initialQuery} />
    </main>
  );
}
