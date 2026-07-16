import type { HTMLAttributes } from "react";

export type IconName = string;

type IconProps = HTMLAttributes<HTMLSpanElement> & {
  name: string;
  size?: number;
  label?: string;
};

const symbols: Record<string, string> = {
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
  check: "✓",
  wind: "≋",
  pressure: "↕",
  arrow: "→",
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
      {symbols[name] ?? "•"}
    </span>
  );
}
