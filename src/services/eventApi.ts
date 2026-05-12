import { Event } from "../types";

const TICKETMASTER_API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY || "";
const TICKETMASTER_BASE = "https://app.ticketmaster.com/discovery/v2";

interface TmEvent {
  id: string;
  name: string;
  description?: string;
  info?: string;
  dates: {
    start: { localDate: string; localTime?: string };
    status: { code: string };
  };
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      country?: { name?: string };
      location?: { latitude?: string; longitude?: string };
    }>;
  };
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
  }>;
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
  images?: Array<{ url: string; width?: number; height?: number; ratio?: string }>;
  url?: string;
}

interface TmResponse {
  _embedded?: { events?: TmEvent[] };
  page?: { totalElements?: number; totalPages?: number };
}

const categoryMap: Record<string, string> = {
  Music: "Live Music",
  "Arts & Theatre": "Theater & Dance",
  Film: "Cinema",
  Sports: "Sports",
  Miscellaneous: "Social",
};

function pickBestImage(images?: TmEvent["images"]): string {
  if (!images?.length) return "";
  const wide = images.find((i) => i.ratio === "16_9" && (i.width ?? 0) >= 640);
  return (wide || images[0]).url;
}

function mapTmEvent(e: TmEvent): Event {
  const venue = e._embedded?.venues?.[0];
  const cls = e.classifications?.[0];
  const segment = cls?.segment?.name || "Miscellaneous";
  const price = e.priceRanges?.[0]?.min ?? 0;
  const tags: string[] = [];
  if (cls?.genre?.name && cls.genre.name !== "Undefined") tags.push(cls.genre.name.toLowerCase());
  if (cls?.subGenre?.name && cls.subGenre.name !== "Undefined") tags.push(cls.subGenre.name.toLowerCase());
  if (!tags.length) tags.push(segment.toLowerCase().replace(/\s+/g, "-"));

  return {
    id: `tm_${e.id}`,
    title: e.name,
    category: categoryMap[segment] || "Social",
    description: e.info || e.description || `${e.name} at ${venue?.name || "Athens"}`,
    date: e.dates.start.localDate,
    time: (e.dates.start.localTime || "19:00").substring(0, 5),
    duration: "2h",
    locationArea: venue?.city?.name ? `${venue.name || venue.city.name}, ${venue.city.name}` : "Athens",
    exactLocation: venue?.name || "Venue details upon booking",
    lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : 37.9838,
    lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : 23.7275,
    isPaid: price > 0,
    price,
    organizerId: "tm_organizer",
    timeZone: "EET (Athens)",
    safetyLevel: "low",
    minTrustTierAccess: "1_explorer",
    maxParticipants: 50,
    tags,
    imageUrl: pickBestImage(e.images) || `https://picsum.photos/seed/${e.id}/800/600`,
    externalLink: e.url,
    isTrending: Math.random() > 0.7,
  };
}

export async function fetchTicketmasterEvents(
  city = "Athens",
  countryCode = "GR",
  size = 30,
): Promise<Event[]> {
  if (!TICKETMASTER_API_KEY) return [];
  try {
    const url = new URL(`${TICKETMASTER_BASE}/events.json`);
    url.searchParams.set("apikey", TICKETMASTER_API_KEY);
    url.searchParams.set("city", city);
    url.searchParams.set("countryCode", countryCode);
    url.searchParams.set("size", String(size));
    url.searchParams.set("sort", "date,asc");
    url.searchParams.set("startDateTime", new Date().toISOString().split(".")[0] + "Z");

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`TM ${res.status}`);
    const data: TmResponse = await res.json();
    return (data._embedded?.events ?? []).map(mapTmEvent);
  } catch (err) {
    console.warn("Ticketmaster fetch failed:", err);
    return [];
  }
}

export function isTicketmasterConfigured(): boolean {
  return !!TICKETMASTER_API_KEY;
}
