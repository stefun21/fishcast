import { FavoritesList } from "@/components/favorites/favorites-list";

export const metadata = { title: "Favorite" };

export default function FavoritesPage() {
  return (
    <main className="page-content favorites-page">
      <section className="page-intro compact-intro">
        <p className="section-kicker">COLECȚIA TA</p>
        <h1>Locurile preferate.</h1>
        <p>Salvate local, fără cont și fără bază de date externă.</p>
      </section>
      <FavoritesList />
    </main>
  );
}
