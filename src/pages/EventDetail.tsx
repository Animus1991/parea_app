import { useStore } from "../store";
import { PlatformEventBanner } from "../components/events/PlatformEventBanner";
import EventDetailPageBody from "../components/events/EventDetailPageBody";
import { isDarkTheme } from "../lib/themes";
import type { EventDetailMapAccent } from "../components/events/EventMap";

function accentForTheme(theme: string): EventDetailMapAccent {
  switch (theme) {
    case "vibrant":
    case "vibrant-dark":
      return "vibrant";
    case "neon":
    case "neon-dark":
      return "neon";
    case "bento":
    case "bento-dark":
      return "bento";
    default:
      return "classic";
  }
}

/** One EventDetail body for every theme — dark surfaces follow the theme. */
export default function EventDetail() {
  const theme = useStore((s) => s.theme);
  return (
    <>
      <PlatformEventBanner />
      <EventDetailPageBody accent={accentForTheme(theme)} darkSurface={isDarkTheme(theme)} />
    </>
  );
}
