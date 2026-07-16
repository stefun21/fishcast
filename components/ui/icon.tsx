export type IconName =
  | "arrow"
  | "check"
  | "chevron"
  | "fish"
  | "heart"
  | "home"
  | "location"
  | "map"
  | "pressure"
  | "search"
  | "wind";

const paths: Record<IconName, React.ReactNode> = {
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  fish: <><path d="M6.5 12c2.5-4 6.4-5.8 10.6-4.6L21 4v8l-3.9-3.4C12.9 9.8 9 8 6.5 12Z" /><path d="M6.5 12c2.5 4 6.4 5.8 10.6 4.6L21 20v-8l-3.9 3.4C12.9 14.2 9 16 6.5 12Z" /><circle cx="14.8" cy="10.2" r=".8" fill="currentColor" stroke="none" /><path d="M6.5 12 3 9v6l3.5-3Z" /></>,
  heart: <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15" /><path d="M15 6v15" /></>,
  pressure: <><circle cx="12" cy="12" r="8" /><path d="M12 12 16 8" /><path d="M8 16h8" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  wind: <><path d="M3 8h10a3 3 0 1 0-3-3" /><path d="M3 12h15a3 3 0 1 1-3 3" /><path d="M3 16h7" /></>,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}
