import { LakeExplorer } from "@/components/lakes/lake-explorer";

export const metadata = { title: "Explorează" };

export default function ExplorePage() {
  return (
    <main className="page-content explore-page">
      <section className="page-intro compact-intro">
        <p className="section-kicker">EXPLORE</p>
        <h1>Găsește locul potrivit.</h1>
        <p>Caută, filtrează și sortează locațiile demonstrative după poziția ta.</p>
      </section>
      <LakeExplorer />
    </main>
  );
}
