import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

const actions: Array<{
  title: string;
  description: string;
  href: string;
  icon: IconName;
}> = [
  {
    title: "Lângă mine",
    description: "Ordonare după distanță",
    href: "/explore",
    icon: "location",
  },
  {
    title: "Explorează",
    description: "Listă și hartă",
    href: "/explore",
    icon: "map",
  },
  {
    title: "Favorite",
    description: "Salvate pe dispozitiv",
    href: "/favorites",
    icon: "heart",
  },
];

export function QuickActions() {
  return (
    <div className="quick-actions">
      {actions.map((action) => (
        <Link className="quick-action-card" href={action.href} key={action.title}>
          <span className="quick-action-icon"><Icon name={action.icon} size={21} /></span>
          <span>
            <strong>{action.title}</strong>
            <small>{action.description}</small>
          </span>
          <Icon name="chevron" size={17} />
        </Link>
      ))}
    </div>
  );
}
