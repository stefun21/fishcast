import type { HTMLAttributes } from "react";

type IconName =
  | "heart"
  | "heart-filled"
  | "map-pin"
  | "navigation"
  | "fish"
  | "search"
  | "clock"
  | "phone"
  | "globe"
  | "star"
  | "route"
  | "location";

type IconProps = HTMLAttributes<HTMLSpanElement> & {
  name: IconName;
  size?: number;
  label?: string;
};

const symbols: Record<IconName, string> = {
  heart: "♡",
  "heart-filled": "♥",
  "map-pin": "📍",
  navigation: "➤",
  fish: "🐟",
  search: "⌕",
  clock: "◷",
  phone: "☎",
  globe: "◎",
  star: "★",
  route: "↗",
  location: "◉",
};

export function Icon({
  name,
  size = 18,
  label,
  style,
  ...props
}: IconProps) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontSize: size,
        lineHeight: 1,
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      {symbols[name]}
    </span>
  );
}
