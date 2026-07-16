"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";

const items: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "Acasă", icon: "home" },
  { href: "/explore", label: "Explorează", icon: "map" },
  { href: "/favorites", label: "Favorite", icon: "heart" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Navigație mobilă">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link className={active ? "bottom-nav-item active" : "bottom-nav-item"} href={item.href} key={item.href}>
            <Icon name={item.icon} size={21} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
