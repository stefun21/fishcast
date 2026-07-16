import Link from "next/link";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { Icon } from "@/components/ui/icon";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="FishCast România - Acasă">
        <span className="brand-mark">
          <Icon name="fish" size={23} />
        </span>
        <span className="brand-copy">
          <strong>FishCast</strong>
          <small>România</small>
        </span>
      </Link>

      <nav className="desktop-nav" aria-label="Navigație principală">
        <Link href="/">Acasă</Link>
        <Link href="/explore">Explorează</Link>
        <Link href="/favorites">Favorite</Link>
      </nav>

      <div className="header-actions">
        <InstallAppButton />
        <span className="build-pill">
          <span className="status-dot" /> V2 în construcție
        </span>
      </div>
    </header>
  );
}
